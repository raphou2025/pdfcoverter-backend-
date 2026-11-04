const os = require('os');

const WINDOW_MS = 60 * 1000;
const BUCKET_MS = 1000;
const MAX_RECENT_ERRORS = 10;
const requestBuckets = [];
const recentErrors = [];
let lifetimeRequests = 0;
let lifetimeErrors = 0;
let previousCpuSnapshot = os.cpus();
let previousCpuSampleAt = Date.now();

const getCpuUsage = () => {
  const currentCpus = os.cpus();
  const elapsedMs = Date.now() - previousCpuSampleAt;
  let totalDelta = 0;
  let idleDelta = 0;

  currentCpus.forEach((cpu, index) => {
    const previousTimes = previousCpuSnapshot[index]?.times;
    if (!previousTimes) return;

    const total = Object.values(cpu.times).reduce((sum, value) => sum + value, 0);
    const previousTotal = Object.values(previousTimes).reduce((sum, value) => sum + value, 0);
    totalDelta += total - previousTotal;
    idleDelta += cpu.times.idle - previousTimes.idle;
  });

  previousCpuSnapshot = currentCpus;
  previousCpuSampleAt = Date.now();

  if (elapsedMs <= 0 || totalDelta <= 0) return 0;
  return Math.round((1 - idleDelta / totalDelta) * 1000) / 10;
};

const recordRequest = (req, res, startedAt) => {
  if ((!req.path.startsWith('/api/') && req.path !== '/api') || req.path.startsWith('/api/admin/monitoring')) return;

  const now = Date.now();
  const durationMs = now - startedAt;
  const bucketStart = Math.floor(now / BUCKET_MS) * BUCKET_MS;
  let bucket = requestBuckets[requestBuckets.length - 1];

  if (!bucket || bucket.start !== bucketStart) {
    bucket = { start: bucketStart, requests: 0, errors: 0, totalLatencyMs: 0 };
    requestBuckets.push(bucket);
  }

  bucket.requests += 1;
  bucket.totalLatencyMs += durationMs;
  lifetimeRequests += 1;

  if (res.statusCode >= 500) {
    bucket.errors += 1;
    lifetimeErrors += 1;
    recentErrors.unshift({
      timestamp: new Date(now).toISOString(),
      method: req.method,
      route: `${req.baseUrl || ''}${req.route?.path || '/unmatched'}`,
      statusCode: res.statusCode
    });
    recentErrors.length = Math.min(recentErrors.length, MAX_RECENT_ERRORS);
  }

  while (requestBuckets.length && now - requestBuckets[0].start >= WINDOW_MS) {
    requestBuckets.shift();
  }
};

const monitoringMiddleware = (req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => recordRequest(req, res, startedAt));
  next();
};

const getMonitoringSnapshot = async (prisma) => {
  const now = Date.now();
  const recentBuckets = requestBuckets.filter((bucket) => now - bucket.start < WINDOW_MS);
  const requestsLastMinute = recentBuckets.reduce((sum, bucket) => sum + bucket.requests, 0);
  const errorsLastMinute = recentBuckets.reduce((sum, bucket) => sum + bucket.errors, 0);
  const totalLatencyMs = recentBuckets.reduce((sum, bucket) => sum + bucket.totalLatencyMs, 0);

  let database = { status: 'unavailable', responseTimeMs: null };
  const databaseStartedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = { status: 'healthy', responseTimeMs: Date.now() - databaseStartedAt };
  } catch (error) {
    console.error('Database health check failed:', error);
  }

  const systemMemory = {
    totalBytes: os.totalmem(),
    usedBytes: os.totalmem() - os.freemem()
  };
  systemMemory.usedPercent = Math.round((systemMemory.usedBytes / systemMemory.totalBytes) * 1000) / 10;

  return {
    sampledAt: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    system: {
      cpuUsagePercent: getCpuUsage(),
      memory: systemMemory,
      processMemory: process.memoryUsage()
    },
    traffic: {
      requestsLastMinute,
      errorsLastMinute,
      requestsPerSecond: Math.round((requestsLastMinute / 60) * 100) / 100,
      averageLatencyMs: requestsLastMinute ? Math.round(totalLatencyMs / requestsLastMinute) : 0,
      requestsSinceStart: lifetimeRequests,
      errorsSinceStart: lifetimeErrors
    },
    database,
    recentErrors: [...recentErrors]
  };
};

module.exports = { monitoringMiddleware, getMonitoringSnapshot };
