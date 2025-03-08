import { Router } from 'express';
import { AuditLog } from '../models';
import { json2csv } from 'json2csv';
import { format, parseISO } from 'date-fns';

const router = Router();

// Get paginated audit logs with filters
router.get('/', async (req, res) => {
  try {
    const { start, end, userId, actionType, page = 1 } = req.query;
    
    const where = {
      timestamp: {
        [Sequelize.Op.between]: [new Date(start), new Date(end)]
      }
    };

    if (userId) where.userId = userId;
    if (actionType) where.actionType = actionType;

    const { count, rows: logs } = await AuditLog.findAndCountAll({
      where,
      order: [['timestamp', 'DESC']],
      limit: 50,
      offset: (page - 1) * 50
    });

    // Generate time-series data for chart
    const stats = await AuditLog.findAll({
      attributes: [
        [Sequelize.fn('date_trunc', 'hour', Sequelize.col('timestamp')), 'time'],
        [Sequelize.fn('count', Sequelize.col('id')), 'count']
      ],
      where,
      group: ['time'],
      order: ['time']
    });

    res.json({
      logs: logs.map(log => log.toJSON()),
      stats: {
        labels: stats.map(s => format(parseISO(s.time), 'MMM dd HH:mm')),
        data: stats.map(s => s.count)
      },
      totalPages: Math.ceil(count / 50)
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Export audit logs to encrypted CSV
router.post('/export', async (req, res) => {
  try {
    const { start, end } = req.body;
    
    const logs = await AuditLog.findAll({
      where: {
        timestamp: {
          [Sequelize.Op.between]: [new Date(start), new Date(end)]
        }
      },
      order: [['timestamp', 'DESC']]
    });

    const csv = json2csv(logs.map(log => ({
      Timestamp: format(log.timestamp, 'yyyy-MM-dd HH:mm:ss'),
      'User ID': log.userId,
      Action: log.actionType,
      Endpoint: log.endpoint,
      Status: log.statusCode,
      'Response Time': `${log.responseTime}ms`
    })));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit-export.csv');
    res.send(csv);

  } catch (error) {
    res.status(500).json({ error: 'Export failed' });
  }
});

export default router;