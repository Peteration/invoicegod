import { useSession } from 'next-auth/react';
import { createSecureApiClient } from '../../lib/api';

export default function RiskDashboard() {
  const { data: session } = useSession();
  const [riskData, setRiskData] = useState<RiskProfile[]>([]);

  useEffect(() => {
    const fetchRiskData = async () => {
      if (session) {
        const api = createSecureApiClient(session.accessToken);
        try {
          const response = await api.get('/v1/risk-profiles');
          setRiskData(response.data.filter((d: RiskProfile) => d.score >= 0.3));
        } catch (error) {
          console.error('Secure data fetch failed:', error);
        }
      }
    };
    
    fetchRiskData();
  }, [session]);

  return (
    <div className="risk-dashboard">
      <h3 className="text-xl font-bold mb-4">Payment Risk Intelligence</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {riskData.map((profile) => (
          <RiskCard key={profile.clientId} profile={profile} />
        ))}
      </div>
    </div>
  );
}

function RiskCard({ profile }: { profile: RiskProfile }) {
  const riskLevel = profile.score > 0.7 ? 'high' : profile.score > 0.4 ? 'medium' : 'low';
  
  return (
    <div className={`risk-card ${riskLevel}`}>
      <div className="flex justify-between items-start">
        <h4 className="font-semibold truncate">{profile.clientName}</h4>
        <span className="risk-badge">{Math.round(profile.score * 100)}%</span>
      </div>
      <div className="mt-2 text-sm">
        <p>Avg Delay: {profile.avgPaymentDays} days</p>
        <p>Amount at Risk: ${profile.pendingAmount.toLocaleString()}</p>
      </div>
      {profile.recommendation && (
        <div className="mt-3 p-2 bg-black/20 rounded">
          <p className="text-xs font-medium">Recommendation:</p>
          <p className="text-xs">{profile.recommendation}</p>
        </div>
      )}
    </div>
  );
}