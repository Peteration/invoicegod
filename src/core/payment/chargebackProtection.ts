import { FraudAssessment, PaymentMethod } from './paymentTypes';
import { fetchIPInfo } from '../security/ipAnalysis';
import { validateEmail } from '../security/emailVerifier';

const HIGH_RISK_COUNTRIES = new Set(['BR', 'NG', 'PK', 'VN', 'ID']);
const DISALLOWED_IPS = new Set(process.env.BLOCKED_IPS?.split(',') || []);

export async function assessFraudRisk(
  payment: PaymentMethod,
  amount: number,
  userEmail: string,
  userIp: string
): Promise<FraudAssessment> {
  // Initial validation
  if (DISALLOWED_IPS.has(userIp)) {
    return { riskLevel: 'blocked', reasons: ['IP blocked'] };
  }

  const [ipInfo, emailValid] = await Promise.all([
    fetchIPInfo(userIp),
    validateEmail(userEmail)
  ]);

  const riskFactors: string[] = [];
  let riskScore = 0;

  // Geographic risk
  if (HIGH_RISK_COUNTRIES.has(ipInfo?.countryCode)) {
    riskScore += 30;
    riskFactors.push(`High-risk country: ${ipInfo.countryCode}`);
  }

  // Email risk
  if (!emailValid.valid) {
    riskScore += 25;
    riskFactors.push(`Email verification failed: ${emailValid.reason}`);
  }

  // Amount risk
  if (amount > 5000) { // $5000 threshold
    riskScore += 15;
    riskFactors.push('Large transaction amount');
  }

  // Velocity check (pseudo-code)
  const recentTxs = await getRecentTransactions(userEmail);
  if (recentTxs.count > 3) {
    riskScore += 20;
    riskFactors.push(`High transaction velocity: ${recentTxs.count} txs`);
  }

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'blocked' = 'low';
  if (riskScore >= 70) riskLevel = 'blocked';
  else if (riskScore >= 50) riskLevel = 'high';
  else if (riskScore >= 30) riskLevel = 'medium';

  return {
    riskLevel,
    riskScore,
    reasons: riskFactors,
    metadata: {
      ipInfo,
      emailValid
    }
  };
}

// Mock functions (implement with your actual services)
async function fetchIPInfo(ip: string) {
  const res = await fetch(`https://ipapi.co/${ip}/json/`);
  return res.json();
}

async function validateEmail(email: string) {
  const domain = email.split('@')[1];
  const mxRecords = await dnsPromises.resolveMx(domain);
  return {
    valid: mxRecords.length > 0,
    reason: mxRecords.length ? '' : 'No MX records found'
  };
}

async function getRecentTransactions(email: string) {
  // Implement with your database
  return { count: 0 };
}