import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  calculateBuffer,
  calculateReverseTRR,
  CalculationResult,
  ReverseCalculationResult
} from "@/lib/inventory-math";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { Info, Calculator, Activity, TrendingUp, Settings2, CheckCircle2, AlertCircle, Sliders } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

function getMaseLabel(mase: number): { label: string; colorClass: string } {
  if (mase < 0.5) return { label: "Excellent", colorClass: "text-green-600 dark:text-green-400" };
  if (mase < 0.8) return { label: "Good", colorClass: "text-blue-600 dark:text-blue-400" };
  if (mase < 1.0) return { label: "Fair", colorClass: "text-amber-600 dark:text-amber-400" };
  return { label: "Poor", colorClass: "text-red-600 dark:text-red-400" };
}

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 font-sans text-slate-900 dark:text-slate-100">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <header className="space-y-2 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-900/20">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Inventory Analytics Suite</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl">
            Advanced statistical tools for inventory optimization. Calculate safety stocks and lead times using Croston's method and Monte Carlo simulations.
          </p>
        </header>

        <Tabs defaultValue="buffer" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 h-12 bg-slate-200/50 dark:bg-slate-800/50 p-1">
            <TabsTrigger value="buffer" className="text-base data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm transition-all">Buffer Calculator</TabsTrigger>
            <TabsTrigger value="trr" className="text-base data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm transition-all">Reverse TRR Calculator</TabsTrigger>
          </TabsList>
          
          <TabsContent value="buffer" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
            <BufferCalculator />
          </TabsContent>
          
          <TabsContent value="trr" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
            <TRRCalculator />
          </TabsContent>
        </Tabs>

        <MethodologySection />

        <footer className="text-center text-sm text-slate-500 dark:text-slate-400 pt-8 pb-4 border-t border-slate-200 dark:border-slate-800">
          <p className="mb-2">
            Open source under AGPL-3.0 license
          </p>
          <div className="flex justify-center gap-4">
            <a 
              href="https://github.com/blasthappy82/Inventory_Analytics_Suite" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              GitHub
            </a>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <a 
              href="https://buffercalculator.netlify.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Netlify
            </a>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <a 
              href="https://blasthappy82.github.io/Inventory_Analytics_Suite/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              GitHub Pages
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}

function BufferCalculator() {
  const [demandInput, setDemandInput] = useState("8\n12\n9\n0\n5\n0\n11\n7\n0\n4");
  const [serviceLevel, setServiceLevel] = useState("90");
  const [trr, setTrr] = useState("9");
  const [alpha, setAlpha] = useState("0.15");
  const [iterations, setIterations] = useState(50000);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = () => {
    try {
      setError(null);
      const demands = demandInput
        .split(/[\s,]+/)
        .map(v => parseFloat(v.trim()))
        .filter(v => !isNaN(v));

      const serviceLevelNum = parseFloat(serviceLevel);
      const trrNum = parseFloat(trr);
      const alphaNum = parseFloat(alpha);

      if (demands.length === 0) throw new Error("Please enter valid demand data.");
      if (demands.length > 48) throw new Error("Too many data points (max 48 recommended).");
      if (isNaN(serviceLevelNum) || serviceLevelNum < 50 || serviceLevelNum > 99.99) throw new Error("Service level must be between 50% and 99.99%.");
      if (isNaN(alphaNum) || alphaNum < 0.01 || alphaNum > 1) throw new Error("Smoothing constant must be between 0.01 and 1.0.");
      if (isNaN(trrNum) || trrNum < 0) throw new Error("TRR / Lead Time must be 0 or greater.");

      const res = calculateBuffer(demands, serviceLevelNum, trrNum, alphaNum, iterations);
      setResult(res);
    } catch (err: any) {
      setError(err.message);
      setResult(null);
    }
  };

  // Auto-calculate on mount
  useEffect(() => {
    handleCalculate();
  }, []);

  const chartData = demandInput
    .split(/[\s,]+/)
    .map((v, i) => ({ index: i + 1, value: parseFloat(v.trim()) }))
    .filter(d => !isNaN(d.value));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <Card className="lg:col-span-4 border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings2 className="w-5 h-5 text-blue-600" />
            Parameters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-3">
            <Label htmlFor="demand" className="flex justify-between">
              Historical Demand (Monthly)
              <span className="text-xs text-slate-400 font-normal">Oldest → Newest</span>
            </Label>
            <Textarea
              id="demand"
              value={demandInput}
              onChange={(e) => setDemandInput(e.target.value)}
              placeholder="Enter monthly demand values..."
              className="font-mono text-sm min-h-[180px] resize-none bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-blue-500/20"
            />
            <p className="text-xs text-slate-500">
              Enter units sold per month. Supports up to 48 months. Enter 0 for months with no demand.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="service-level">Service Level Goal (%)</Label>
                <InfoPopover content="Target probability of not stocking out during lead time. 90% is common for general inventory; 95-99% for critical parts. Higher levels require more safety stock." />
              </div>
              <Input
                id="service-level"
                type="number"
                value={serviceLevel}
                onChange={(e) => setServiceLevel(e.target.value)}
                min={50}
                max={99.99}
                step={0.1}
                className="font-mono"
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="trr">TRR / Lead Time (Days)</Label>
                <InfoPopover content="Enter lead time in days. Calculations assume 30-day months for converting between daily TRR and monthly demand data." />
              </div>
              <Input
                id="trr"
                type="number"
                value={trr}
                onChange={(e) => setTrr(e.target.value)}
                min={0}
                step={0.1}
                className="font-mono"
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="alpha">Smoothing Constant (α)</Label>
                <InfoPopover content="Controls responsiveness of Croston's method. Research recommends 0.1-0.2 for intermittent demand; 0.15 is a balanced default. Higher values react faster to recent changes." />
              </div>
              <Input
                id="alpha"
                type="number"
                value={alpha}
                onChange={(e) => setAlpha(e.target.value)}
                min={0.01}
                max={1}
                step={0.01}
                className="font-mono"
              />
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="advanced-settings" className="border-none">
                <AccordionTrigger className="py-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4" />
                    Advanced Settings
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-2">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="text-xs font-medium text-slate-500">Simulation Iterations</Label>
                        <span className="text-xs font-mono text-slate-600 dark:text-slate-400">{iterations.toLocaleString()}</span>
                      </div>
                      <Slider
                        value={[iterations]}
                        min={10000}
                        max={100000}
                        step={5000}
                        onValueChange={(vals) => setIterations(vals[0])}
                        className="py-2"
                      />
                      <p className="text-[10px] text-slate-400">Higher iterations increase accuracy but slow down calculation.</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <Button onClick={handleCalculate} className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-900/10 transition-all active:scale-[0.98]">
            Calculate Buffer
          </Button>
          
          {error && (
            <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="lg:col-span-8 space-y-6">
        {result && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard
                title="Total Buffer"
                value={`${result.totalBuffer.toFixed(2)} units`}
                subtitle="Base + Safety Stock"
                highlight
              />
              <MetricCard
                title="Base Stock"
                value={`${result.baseStock.toFixed(2)} units`}
                subtitle="Expected demand during TRR"
              />
              <MetricCard
                title="Safety Stock"
                value={`${result.safetyStock.toFixed(2)} units`}
                subtitle={result.method === 'Monte Carlo' ? 'Via simulation' : 'Via standard deviation'}
              />
            </div>

            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex justify-between items-center">
                  <span>Demand Analysis</span>
                  <Badge variant={result.predictable ? "default" : "secondary"} className={result.predictable ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-amber-100 text-amber-800 hover:bg-amber-100"}>
                    {result.predictable ? "Predictable (Normal)" : "Intermittent / Non-Normal"}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Forecast Error (MASE): {result.mase.toFixed(3)} (<span className={`font-medium ${getMaseLabel(result.mase).colorClass}`}>{getMaseLabel(result.mase).label}</span>) • Anderson-Darling p-value: {result.pValue?.toFixed(3) ?? "N/A"}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="index" tick={{fontSize: 12}} tickLine={false} axisLine={false} label={{ value: 'Month', position: 'insideBottom', offset: -5, fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} label={{ value: 'Units', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip 
                      cursor={{fill: 'rgba(0,0,0,0.05)'}}
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Monthly Demand" />
                    <ReferenceLine y={result.forecast} stroke="#ef4444" strokeDasharray="3 3" label={{ value: `Forecast: ${result.forecast.toFixed(2)}`, position: 'insideTopRight', fill: '#ef4444', fontSize: 12 }} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-lg text-sm text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
              <strong className="text-slate-900 dark:text-slate-200">Analysis Method:</strong>{" "}
              {result.predictable
                ? "The demand pattern follows a normal distribution. Standard safety stock formulas were used."
                : `The demand pattern is intermittent or non-normal. A Monte Carlo simulation (${iterations.toLocaleString()} iterations) was used to determine safety stock requirements accurately.`}
            </div>

            {result.mase >= 1.0 && chartData.length < 48 && (
              <Alert className="bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-800">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Forecast Accuracy Below Baseline</AlertTitle>
                <AlertDescription>
                  You're using {chartData.length} month{chartData.length !== 1 ? 's' : ''} of data. Consider adding up to 48 months of historical demand for improved forecast accuracy.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TRRCalculator() {
    const [demandInput, setDemandInput] = useState("8\n12\n9\n0\n5\n0\n11\n7\n0\n4");
    const [buffer, setBuffer] = useState("120");
    const [serviceLevel, setServiceLevel] = useState("90");
    const [alpha, setAlpha] = useState("0.15");
    const [iterations, setIterations] = useState(50000);
    const [result, setResult] = useState<ReverseCalculationResult | null>(null);
    const [error, setError] = useState<string | null>(null);
  
    const handleCalculate = () => {
      try {
        setError(null);
        const demands = demandInput
          .split(/[\s,]+/)
          .map(v => parseFloat(v.trim()))
          .filter(v => !isNaN(v));
  
        const bufferNum = parseFloat(buffer);
        const serviceLevelNum = parseFloat(serviceLevel);
        const alphaNum = parseFloat(alpha);

        if (demands.length === 0) throw new Error("Please enter valid demand data.");
        if (isNaN(bufferNum) || bufferNum <= 0) throw new Error("Current buffer must be greater than 0.");
        if (isNaN(serviceLevelNum) || serviceLevelNum < 50 || serviceLevelNum > 99.99) throw new Error("Service level must be between 50% and 99.99%.");
        if (isNaN(alphaNum) || alphaNum < 0.01 || alphaNum > 1) throw new Error("Smoothing constant must be between 0.01 and 1.0.");
  
        const res = calculateReverseTRR(demands, bufferNum, serviceLevelNum, alphaNum, iterations);
        setResult(res);
      } catch (err: any) {
        setError(err.message);
        setResult(null);
      }
    };

    // Auto calc on mount
    useEffect(() => {
        handleCalculate();
    }, []);

    const chartData = demandInput
      .split(/[\s,]+/)
      .map((v, i) => ({ index: i + 1, value: parseFloat(v.trim()) }))
      .filter(d => !isNaN(d.value));
  
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-4 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings2 className="w-5 h-5 text-green-600" />
              Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-3">
              <Label htmlFor="trr-demand" className="flex justify-between">
                Historical Demand (Monthly)
                <span className="text-xs text-slate-400 font-normal">Oldest → Newest</span>
              </Label>
              <Textarea
                id="trr-demand"
                value={demandInput}
                onChange={(e) => setDemandInput(e.target.value)}
                placeholder="Enter monthly demand values..."
                className="font-mono text-sm min-h-[150px] resize-none bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:border-green-500 focus:ring-green-500/20"
              />
              <p className="text-xs text-slate-500">
                Enter units sold per month. Supports up to 48 months. Enter 0 for months with no demand.
              </p>
            </div>
            
            <div className="grid gap-2">
                <Label htmlFor="buffer">Current Buffer (Units)</Label>
                <Input
                  id="buffer"
                  type="number"
                  value={buffer}
                  onChange={(e) => setBuffer(e.target.value)}
                  min={1}
                  className="font-mono"
                />
            </div>

            <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="trr-service">Service Level Goal (%)</Label>
                  <InfoPopover content="Target probability of not stocking out during lead time. 90% is common for general inventory; 95-99% for critical parts. Higher levels require more safety stock." />
                </div>
                <Input
                  id="trr-service"
                  type="number"
                  value={serviceLevel}
                  onChange={(e) => setServiceLevel(e.target.value)}
                  min={50}
                  max={99.99}
                  step={0.1}
                  className="font-mono"
                />
            </div>

            <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="trr-alpha">Smoothing Constant (α)</Label>
                  <InfoPopover content="Controls responsiveness of Croston's method. Research recommends 0.1-0.2 for intermittent demand; 0.15 is a balanced default. Higher values react faster to recent changes." />
                </div>
                <Input
                  id="trr-alpha"
                  type="number"
                  value={alpha}
                  onChange={(e) => setAlpha(e.target.value)}
                  min={0.01}
                  max={1}
                  step={0.01}
                  className="font-mono"
                />
            </div>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="advanced-settings" className="border-none">
                <AccordionTrigger className="py-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4" />
                    Advanced Settings
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-2">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="text-xs font-medium text-slate-500">Simulation Iterations</Label>
                        <span className="text-xs font-mono text-slate-600 dark:text-slate-400">{iterations.toLocaleString()}</span>
                      </div>
                      <Slider
                        value={[iterations]}
                        min={10000}
                        max={100000}
                        step={5000}
                        onValueChange={(vals) => setIterations(vals[0])}
                        className="py-2"
                      />
                      <p className="text-[10px] text-slate-400">Higher iterations increase accuracy but slow down calculation.</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
  
            <Button onClick={handleCalculate} className="w-full bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-900/10 transition-all active:scale-[0.98]">
              Calculate Max TRR
            </Button>
            
            {error && (
                <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
          </CardContent>
        </Card>
  
        <div className="lg:col-span-8 space-y-6">
            {result && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <MetricCard
                            title="Max Affordable TRR"
                            value={`${result.maxTRR.toFixed(1)} Days`}
                            subtitle="Lead Time + Review Period"
                            highlight
                            color="green"
                        />
                        <MetricCard
                            title="Monthly Forecast"
                            value={`${result.forecast.toFixed(2)} units`}
                            subtitle="Expected demand per month"
                            color="slate"
                        />
                    </div>
                    
                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-lg flex justify-between items-center">
                          <span>Demand Analysis</span>
                          <Badge variant={result.predictable ? "default" : "secondary"} className={result.predictable ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-amber-100 text-amber-800 hover:bg-amber-100"}>
                            {result.predictable ? "Predictable (Normal)" : "Intermittent / Non-Normal"}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          Forecast Error (MASE): {result.mase.toFixed(3)} (<span className={`font-medium ${getMaseLabel(result.mase).colorClass}`}>{getMaseLabel(result.mase).label}</span>) • Anderson-Darling p-value: {result.pValue?.toFixed(3) ?? "N/A"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 24 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="index" tick={{fontSize: 12}} tickLine={false} axisLine={false} label={{ value: 'Month', position: 'insideBottom', offset: -5, fontSize: 11, fill: '#94a3b8' }} />
                            <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} label={{ value: 'Units', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: '#94a3b8' }} />
                            <Tooltip 
                              cursor={{fill: 'rgba(0,0,0,0.05)'}}
                              contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                            />
                            <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} name="Monthly Demand" />
                            <ReferenceLine y={result.forecast} stroke="#ef4444" strokeDasharray="3 3" label={{ value: `Forecast: ${result.forecast.toFixed(2)}`, position: 'insideTopRight', fill: '#ef4444', fontSize: 12 }} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                        <CardHeader>
                            <CardTitle className="text-lg">Recommendation</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                                With your current buffer of <strong className="text-slate-900 dark:text-white">{buffer} units</strong>, 
                                you can safely support a Time to Reliable Replenishment (TRR) of up to <strong className="text-green-600 dark:text-green-400 text-xl">{result.maxTRR.toFixed(1)} days</strong> 
                                while maintaining a {serviceLevel}% service level.
                            </p>
                            <Separator />
                            <div className="grid grid-cols-2 gap-4 text-sm text-slate-500">
                                <div>
                                    <span className="block font-semibold text-slate-700 dark:text-slate-300">Demand Pattern</span>
                                    {result.predictable ? "Normal Distribution" : "Intermittent / Complex"}
                                </div>
                                <div>
                                    <span className="block font-semibold text-slate-700 dark:text-slate-300">Methodology</span>
                                    {result.explanation}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {result.mase >= 1.0 && chartData.length < 48 && (
                      <Alert className="bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-800">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Forecast Accuracy Below Baseline</AlertTitle>
                        <AlertDescription>
                          You're using {chartData.length} month{chartData.length !== 1 ? 's' : ''} of data. Consider adding up to 48 months of historical demand for improved forecast accuracy.
                        </AlertDescription>
                      </Alert>
                    )}
                </>
            )}
        </div>
      </div>
    );
}

function InfoPopover({ content }: { content: string }) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="cursor-pointer"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <Info className="w-4 h-4 text-slate-400 hover:text-blue-500 transition-colors" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 bg-slate-800 text-white border-slate-700 shadow-xl"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <p className="text-xs leading-relaxed">{content}</p>
      </PopoverContent>
    </Popover>
  );
}

function MetricCard({ title, value, subtitle, highlight = false, color = "blue" }: { title: string, value: string, subtitle: string, highlight?: boolean, color?: "blue" | "green" | "slate" }) {
    const colorStyles = {
        blue: "text-blue-600 dark:text-blue-400",
        green: "text-green-600 dark:text-green-400",
        slate: "text-slate-900 dark:text-white"
    };

    return (
      <Card className={`border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md ${highlight ? 'ring-2 ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-950 ' + (color === 'blue' ? 'ring-blue-100 dark:ring-blue-900' : 'ring-green-100 dark:ring-green-900') : ''}`}>
        <CardContent className="p-6">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">{title}</p>
          <div className={`text-3xl font-bold ${colorStyles[color]}`}>{value}</div>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>
        </CardContent>
      </Card>
    );
}

function MethodologySection() {
  return (
    <Card className="bg-slate-50 dark:bg-slate-900 border-none shadow-inner">
      <CardContent className="p-8 space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            Methodology Review
        </h3>
        <div className="grid md:grid-cols-2 gap-8 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            <div className="space-y-2">
                <h4 className="font-semibold text-slate-900 dark:text-white">Statistical Soundness</h4>
                <p>
                    The calculators employ robust statistical methods tailored for supply chain dynamics. 
                    <strong> Croston's Method</strong> (with SBA correction) is used for forecasting, which is superior to simple moving averages for intermittent demand.
                </p>
                <p>
                    <strong>Note:</strong> Demand data is assumed to be monthly. TRR (lead time) is entered in days and automatically converted using a 30-day month assumption.
                </p>
                <p>
                    The <strong>Anderson-Darling test</strong> automatically detects if demand follows a normal distribution. If normality is rejected (p &lt; 0.05), the system switches to a <strong>Monte Carlo simulation</strong> to determine safety stocks, ensuring accuracy even with erratic demand patterns.
                </p>
            </div>
            <div className="space-y-2">
                <h4 className="font-semibold text-slate-900 dark:text-white">Improvements Implemented</h4>
                <ul className="list-disc list-inside space-y-1">
                    <li><strong>Visualization:</strong> Added demand charts to spot trends and outliers visually.</li>
                    <li><strong>Unified Logic:</strong> Refactored statistical core into a shared library to ensure consistency between forward and reverse calculations.</li>
                    <li><strong>Error Handling:</strong> Added robust input validation for demand data.</li>
                    <li><strong>UX:</strong> Modernized interface with clearer hierarchy and results presentation.</li>
                </ul>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
