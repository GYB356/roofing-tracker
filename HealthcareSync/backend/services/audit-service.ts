
import { db } from "../db";
import { sql } from "drizzle-orm";
import { schema } from "@shared/schema";

interface AuditEntry {
  userId: number;
  action: string;
  resource: string;
  resourceId?: number;
  details?: Record<string, any>;
  ipAddress?: string;
}

export class AuditService {
  static async log(entry: AuditEntry) {
    try {
      // Create an audit log table if it doesn't exist
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          action TEXT NOT NULL,
          resource TEXT NOT NULL,
          resource_id INTEGER,
          details JSONB,
          ip_address TEXT,
          timestamp TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      
      // Insert the audit entry
      await db.execute(sql`
        INSERT INTO audit_logs (user_id, action, resource, resource_id, details, ip_address)
        VALUES (${entry.userId}, ${entry.action}, ${entry.resource}, ${entry.resourceId || null}, 
                ${entry.details ? JSON.stringify(entry.details) : null}, ${entry.ipAddress || null})
      `);
      
      console.log(`Audit log created: ${entry.action} on ${entry.resource}`);
    } catch (error) {
      console.error("Error creating audit log:", error);
    }
  }
  
  static async getAuditLogs(filters?: { 
    userId?: number,
    resource?: string,
    action?: string,
    startDate?: Date,
    endDate?: Date,
    limit?: number,
    offset?: number
  }) {
    try {
      let query = `
        SELECT * FROM audit_logs
        WHERE 1=1
      `;
      
      const params: any[] = [];
      let paramIndex = 1;
      
      if (filters?.userId) {
        query += ` AND user_id = $${paramIndex++}`;
        params.push(filters.userId);
      }
      
      if (filters?.resource) {
        query += ` AND resource = $${paramIndex++}`;
        params.push(filters.resource);
      }
      
      if (filters?.action) {
        query += ` AND action = $${paramIndex++}`;
        params.push(filters.action);
      }
      
      if (filters?.startDate) {
        query += ` AND timestamp >= $${paramIndex++}`;
        params.push(filters.startDate);
      }
      
      if (filters?.endDate) {
        query += ` AND timestamp <= $${paramIndex++}`;
        params.push(filters.endDate);
      }
      
      query += ` ORDER BY timestamp DESC`;
      
      if (filters?.limit) {
        query += ` LIMIT $${paramIndex++}`;
        params.push(filters.limit);
      }
      
      if (filters?.offset) {
        query += ` OFFSET $${paramIndex++}`;
        params.push(filters.offset);
      }
      
      const result = await db.execute(sql.raw(query, ...params));
      return result.rows;
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      return [];
    }
  }
}
