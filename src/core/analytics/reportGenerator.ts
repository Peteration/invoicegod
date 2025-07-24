import { InvoiceModel } from '../database/models';
import { TimePeriod } from '../../types';
import { generateCSV } from '../export/csvGenerator';
import { AuditLogger } from '../audit/auditLogger';

const audit = AuditLogger.getInstance();

export class ReportGenerator {
  constructor(private invoiceModel: InvoiceModel) {}

  async generateFinancialReport(
    userId: string,
    period: TimePeriod = 'month'
  ): Promise<FinancialReport> {
    const { startDate, endDate } = this.getDateRange(period);
    
    const report = await this.invoiceModel.aggregate([
      {
        $match: {
          userId,
          status: 'paid',
          paidAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          averageInvoice: { $avg: '$total' },
          count: { $sum: 1 },
          byCurrency: {
            $push: {
              currency: '$currency',
              amount: '$total'
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          period: {
            start: startDate,
            end: endDate
          },
          totalRevenue: 1,
          averageInvoice: 1,
          invoiceCount: 1,
          currencyBreakdown: {
            $reduce: {
              input: '$byCurrency',
              initialValue: [],
              in: {
                $concatArrays: [
                  '$$value',
                  [
                    {
                      currency: '$$this.currency',
                      total: '$$this.amount',
                      percentage: {
                        $divide: [
                          '$$this.amount',
                          '$totalRevenue'
                        ]
                      }
                    }
                  ]
                ]
              }
            }
          }
        }
      }
    ]);

    await audit.logEvent({
      eventType: 'REPORT_GENERATED',
      userId,
      metadata: { reportType: 'financial', period }
    });

    return report[0] || this.emptyReport(startDate, endDate);
  }

  async exportToCSV(
    userId: string,
    period: TimePeriod
  ): Promise<string> {
    const report = await this.generateFinancialReport(userId, period);
    const csvData = [
      ['Period', `${report.period.start} to ${report.period.end}`],
      ['Total Revenue', report.totalRevenue],
      ['Invoice Count', report.invoiceCount],
      ['Average Invoice', report.averageInvoice],
      [],
      ['Currency', 'Amount', 'Percentage']
    ];

    report.currencyBreakdown.forEach((item: any) => {
      csvData.push([
        item.currency,
        item.total,
        `${(item.percentage * 100).toFixed(2)}%`
      ]);
    });

    return generateCSV(csvData);
  }

  private getDateRange(period: TimePeriod): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    let startDate = new Date();

    switch (period) {
      case 'day':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date(0); // All time
    }

    return { startDate, endDate };
  }

  private emptyReport(startDate: Date, endDate: Date): FinancialReport {
    return {
      period: { start: startDate, end: endDate },
      totalRevenue: 0,
      averageInvoice: 0,
      invoiceCount: 0,
      currencyBreakdown: []
    };
  }
}

interface FinancialReport {
  period: {
    start: Date;
    end: Date;
  };
  totalRevenue: number;
  averageInvoice: number;
  invoiceCount: number;
  currencyBreakdown: Array<{
    currency: string;
    total: number;
    percentage: number;
  }>;
}