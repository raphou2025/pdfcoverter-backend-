const prisma = require('../config/db');
const { getMonitoringSnapshot } = require('../services/systemMonitor');

const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const firstActivityDay = new Date(today);
    firstActivityDay.setUTCDate(firstActivityDay.getUTCDate() - 6);

    const [userCount, conversionCount, translationCount, recentUsers, newUsers, conversions, translations] = await Promise.all([
      prisma.user.count(),
      prisma.conversionHistory.count(),
      prisma.translationHistory.count(),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: { id: true, name: true, email: true, role: true, createdAt: true }
      }),
      prisma.user.findMany({
        where: { createdAt: { gte: firstActivityDay } },
        select: { createdAt: true }
      }),
      prisma.conversionHistory.findMany({
        where: { createdAt: { gte: firstActivityDay } },
        select: { createdAt: true }
      }),
      prisma.translationHistory.findMany({
        where: { createdAt: { gte: firstActivityDay } },
        select: { createdAt: true }
      })
    ]);

    const activityByDay = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(firstActivityDay);
      date.setUTCDate(date.getUTCDate() + index);
      const dateKey = date.toISOString().slice(0, 10);
      const countForDay = (records) => records.reduce(
        (count, record) => count + (record.createdAt.toISOString().slice(0, 10) === dateKey ? 1 : 0),
        0
      );

      return {
        date: dateKey,
        users: countForDay(newUsers),
        conversions: countForDay(conversions),
        translations: countForDay(translations)
      };
    });

    const todayKey = today.toISOString().slice(0, 10);
    const countToday = (records) => records.reduce(
      (count, record) => count + (record.createdAt.toISOString().slice(0, 10) === todayKey ? 1 : 0),
      0
    );

    res.json({
      userCount,
      conversionCount,
      translationCount,
      today: {
        users: countToday(newUsers),
        conversions: countToday(conversions),
        translations: countToday(translations)
      },
      activityByDay,
      recentUsers
    });
  } catch (error) {
    console.error('Failed to load admin dashboard:', error);
    res.status(500).json({ message: 'Failed to load admin dashboard' });
  }
};

const getMonitoringStats = async (req, res) => {
  try {
    res.json(await getMonitoringSnapshot(prisma));
  } catch (error) {
    console.error('Failed to load system monitoring stats:', error);
    res.status(500).json({ message: 'Failed to load system monitoring stats' });
  }
};

const getUsers = async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const pageSize = Math.min(50, Math.max(1, Number.parseInt(req.query.pageSize, 10) || 20));

  try {
    const [total, users] = await Promise.all([
      prisma.user.count(),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          preferredLanguage: true,
          createdAt: true,
          _count: { select: { conversions: true, translations: true } }
        }
      })
    ]);

    res.json({
      users: users.map(({ _count, ...user }) => ({
        ...user,
        conversionCount: _count.conversions,
        translationCount: _count.translations
      })),
      total,
      page,
      pageSize
    });
  } catch (error) {
    console.error('Failed to load admin user list:', error);
    res.status(500).json({ message: 'Failed to load admin user list' });
  }
};

module.exports = { getDashboardStats, getMonitoringStats, getUsers };
