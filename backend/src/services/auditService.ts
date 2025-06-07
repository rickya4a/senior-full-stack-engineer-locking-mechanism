import prisma from '../lib/prisma';

export class AuditService {
  static async logForcedRelease(
    adminId: string,
    targetUserId: string,
    appointmentId: string,
    reason?: string
  ) {
    try {
      await prisma.lockAudit.create({
        data: {
          action: 'FORCE_RELEASE',
          adminId,
          targetUserId,
          appointmentId,
          reason
        }
      });
    } catch (error) {
      console.error('Failed to log forced release:', error);
      // Don't throw error - we don't want audit logging to break the main flow
    }
  }

  static async getAuditLogs(appointmentId?: string) {
    try {
      return await prisma.lockAudit.findMany({
        where: appointmentId ? { appointmentId } : undefined,
        include: {
          admin: {
            select: {
              name: true,
              email: true
            }
          },
          targetUser: {
            select: {
              name: true,
              email: true
            }
          },
          appointment: {
            select: {
              title: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      return [];
    }
  }
}