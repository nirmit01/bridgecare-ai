"use client";
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, GitMerge, CheckCircle } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [generatedPlans, setGeneratedPlans] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    // Fetching from local FastAPI
    fetch('http://127.0.0.1:8000/dashboard/1')
      .then(res => res.json())
      .then(setData);
  }, []);

  const handleGeneratePlan = (id: number) => {
    // Simulate AI generation time
    setTimeout(() => {
      setGeneratedPlans(prev => ({ ...prev, [id]: true }));
    }, 600);
  };

  if (!data) return <div className="p-10 text-center">Loading AI Insights...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">BridgeCare AI Dashboard</h1>
        <div className="space-x-2">
          <Button 
            variant="outline" 
            onClick={() => alert("Gnani Voice Agent activated! 'Listening for hospital queries...'")}
          >
            <Mic className="w-4 h-4 mr-2"/> Gnani Voice
          </Button>
          <Button 
            variant="outline"
            onClick={() => alert("Multi-Agent Flow:\n1. Ingestion Agent\n2. Gap Finder (RAG)\n3. Recommender Agent\n4. Rollout Agent")}
          >
            <GitMerge className="w-4 h-4 mr-2"/> Agent Flow
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader><CardTitle>Translation Gap Score</CardTitle></CardHeader>
          <CardContent className="text-4xl font-extrabold text-red-500">{data.gap_score}/100</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Readiness Score</CardTitle></CardHeader>
          <CardContent className="text-4xl font-extrabold text-green-500">{data.readiness_score}/100</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Gaps Identified</CardTitle></CardHeader>
          <CardContent className="text-4xl font-extrabold">{data.gaps_found}</CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-semibold mt-8">Top Recommendations</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {data.top_recommendations.map((rec: any) => (
          <Card key={rec.id}>
            <CardContent className="p-6">
              <p className="text-lg font-medium">{rec.text}</p>
              
              {!generatedPlans[rec.id] ? (
                <Button 
                  className="mt-6 w-full" 
                  onClick={() => handleGeneratePlan(rec.id)}
                >
                  Generate 4-Week Rollout
                </Button>
              ) : (
                <div className="mt-6 p-4 bg-zinc-50 border rounded-md text-sm space-y-2">
                  <div className="flex items-center text-green-600 font-bold mb-2">
                    <CheckCircle className="w-4 h-4 mr-2" /> AI Plan Generated
                  </div>
                  <p><strong>Week 1:</strong> Staff Training & Protocol Review</p>
                  <p><strong>Week 2:</strong> Dry-run Pilot in single ward</p>
                  <p><strong>Week 3:</strong> Evaluation & Feedback loop</p>
                  <p><strong>Week 4:</strong> Full Department Deployment</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}