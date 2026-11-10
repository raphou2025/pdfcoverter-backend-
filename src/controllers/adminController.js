// const prisma = require('../config/db');
// const { getMonitoringSnapshot } = require('../services/systemMonitor');

// const getDashboardStats = async (req, res) => {
//   try {
//     const now = new Date();
//     const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
//     const firstActivityDay = new Date(today);
//     firstActivityDay.setUTCDate(firstActivityDay.getUTCDate() - 6);

//     const [userCount, conversionCount, translationCount, recentUsers, newUsers, conversions, translations] = await Promise.all([
//       prisma.user.count(),
//       prisma.conversionHistory.count(),
//       prisma.translationHistory.count(),
//       prisma.user.findMany({
//         orderBy: { createdAt: 'desc' },
//         take: 6,
//         select: { id: true, name: true, email: true, role: true, createdAt: true }
//       }),
//       prisma.user.findMany({
//         where: { createdAt: { gte: firstActivityDay } },
//         select: { createdAt: true }
//       }),
//       prisma.conversionHistory.findMany({
//         where: { createdAt: { gte: firstActivityDay } },
//         select: { createdAt: true }
//       }),
//       prisma.translationHistory.findMany({
//         where: { createdAt: { gte: firstActivityDay } },
//         select: { createdAt: true }
//       })
//     ]);

//     const activityByDay = Array.from({ length: 7 }, (_, index) => {
//       const date = new Date(firstActivityDay);
//       date.setUTCDate(date.getUTCDate() + index);
//       const dateKey = date.toISOString().slice(0, 10);
//       const countForDay = (records) => records.reduce(
//         (count, record) => count + (record.createdAt.toISOString().slice(0, 10) === dateKey ? 1 : 0),
//         0
//       );

//       return {
//         date: dateKey,
//         users: countForDay(newUsers),
//         conversions: countForDay(conversions),
//         translations: countForDay(translations)
//       };
//     });

//     const todayKey = today.toISOString().slice(0, 10);
//     const countToday = (records) => records.reduce(
//       (count, record) => count + (record.createdAt.toISOString().slice(0, 10) === todayKey ? 1 : 0),
//       0
//     );

//     res.json({
//       userCount,
//       conversionCount,
//       translationCount,
//       today: {
//         users: countToday(newUsers),
//         conversions: countToday(conversions),
//         translations: countToday(translations)
//       },
//       activityByDay,
//       recentUsers
//     });
//   } catch (error) {
//     console.error('Failed to load admin dashboard:', error);
//     res.status(500).json({ message: 'Failed to load admin dashboard' });
//   }
// };

// const getMonitoringStats = async (req, res) => {
//   try {
//     res.json(await getMonitoringSnapshot(prisma));
//   } catch (error) {
//     console.error('Failed to load system monitoring stats:', error);
//     res.status(500).json({ message: 'Failed to load system monitoring stats' });
//   }
// };

// const getUsers = async (req, res) => {
//   const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
//   const pageSize = Math.min(50, Math.max(1, Number.parseInt(req.query.pageSize, 10) || 20));

//   try {
//     const [total, users] = await Promise.all([
//       prisma.user.count(),
//       prisma.user.findMany({
//         orderBy: { createdAt: 'desc' },
//         skip: (page - 1) * pageSize,
//         take: pageSize,
//         select: {
//           id: true,
//           name: true,
//           email: true,
//           role: true,
//           preferredLanguage: true,
//           createdAt: true,
//           _count: { select: { conversions: true, translations: true } }
//         }
//       })
//     ]);

//     res.json({
//       users: users.map(({ _count, ...user }) => ({
//         ...user,
//         conversionCount: _count.conversions,
//         translationCount: _count.translations
//       })),
//       total,
//       page,
//       pageSize
//     });
//   } catch (error) {
//     console.error('Failed to load admin user list:', error);
//     res.status(500).json({ message: 'Failed to load admin user list' });
//   }
// };

// module.exports = { getDashboardStats, getMonitoringStats, getUsers };

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
  const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
  const role = req.query.role || 'ALL';

  if (!['ALL', 'USER', 'ADMIN'].includes(role)) {
    return res.status(400).json({ message: 'Role filter must be ALL, USER, or ADMIN' });
  }

  const where = {
    ...(role === 'ALL' ? {} : { role }),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        }
      : {})
  };

  try {
    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
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

// 🚨 NEW: Update a user's role
const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['USER', 'ADMIN'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role. Must be USER or ADMIN.' });
  }

  try {
    // Prevent an admin from accidentally demoting themselves
    if (req.user.id === parseInt(id) && role === 'USER') {
      return res.status(400).json({ message: 'You cannot demote yourself.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { role },
      select: { id: true, name: true, email: true, role: true }
    });

    res.json({ message: 'User role updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Failed to update user role:', error);
    res.status(500).json({ message: 'Failed to update user role' });
  }
};

// 🚨 NEW: Delete a user
const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    // Prevent an admin from deleting themselves
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ message: 'You cannot delete your own admin account.' });
    }

    // Prisma will automatically delete their conversions/translations if you set up "onDelete: Cascade" in your schema.
    // If not, you must delete their history first:
    await prisma.conversionHistory.deleteMany({ where: { userId: parseInt(id) } });
    await prisma.translationHistory.deleteMany({ where: { userId: parseInt(id) } });
    
    await prisma.user.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Failed to delete user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

module.exports = { 
  getDashboardStats, 
  getMonitoringStats, 
  getUsers,
  updateUserRole, // 🚨 Export the new functions
  deleteUser 
};