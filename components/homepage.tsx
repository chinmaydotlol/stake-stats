"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts'
import { FaClock, FaCalendarAlt, FaChartLine, FaDice, FaQuestionCircle, FaInfoCircle, FaExclamationTriangle, FaSync } from 'react-icons/fa'
import { IconType } from 'react-icons'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Alert, AlertDescription } from '@/components/ui/alert'

interface GameStats {
  wins: number
  losses: number
  gamesPlayed: number
  winPercentage: number
  lossPercentage: number
}

interface Timeframe {
  value: string
  label: string
  icon: IconType
}

const timeframes: Timeframe[] = [
  { value: 'hourly', label: 'Hourly', icon: FaClock },
  { value: 'weekly', label: 'Weekly', icon: FaCalendarAlt },
  { value: 'monthly', label: 'Monthly', icon: FaCalendarAlt },
  { value: 'overall', label: 'All Time', icon: FaCalendarAlt },
]

const games = [
  'Baccarat', 'Blackjack', 'Crash', 'Diamonds', 'Dice', 'Hilo', 'Keno', 'Limbo', 
  'Mines', 'Plinko', 'Roulette', 'Slide', 'Wheel'
]

export default function StakeStats() {
  const [timeframe, setTimeframe] = useState<string>('overall')
  const [stats, setStats] = useState<GameStats | null>(null)
  const [selectedGame, setSelectedGame] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [activeTab, setActiveTab] = useState<string>('overall')
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchStats = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setLoading(true)
    setError(null)
    
    try {
      let endpoint = `/api/proxy/stats/${timeframe}`
      if (activeTab === 'game' && selectedGame) {
        endpoint = `/api/proxy/stats/game/${timeframe}/${selectedGame.toLowerCase()}`
      }

      const response = await fetch(endpoint, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`)
      }

      const data = await response.json()

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data format received')
      }

      setStats(data as GameStats)
      setError(null)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Fetch aborted')
      } else {
        console.error('Error fetching stats:', err)
        setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      }
    } finally {
      setLoading(false)
    }
  }, [timeframe, selectedGame, activeTab])

  useEffect(() => {
    fetchStats()

    const intervalId = setInterval(fetchStats, 45000) // Update every 20 seconds

    return () => {
      clearInterval(intervalId)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchStats])

  const handleTimeframeChange = (newTimeframe: string) => {
    setTimeframe(newTimeframe)
    setStats(null)
    fetchStats()
  }

  const handleGameChange = (newGame: string) => {
    setSelectedGame(newGame)
    setStats(null)
    fetchStats()
  }

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab)
    setStats(null)
    if (newTab === 'overall') {
      setSelectedGame('')
    }
    fetchStats()
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden relative">
      <AnimatedBackground />
      <div className="relative z-10 max-w-7xl mx-auto p-8">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Stake.com Statistics
          </h1>
          <p className="text-gray-400">Unveiling the truth behind the numbers</p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid grid-cols-5 max-w-2xl mx-auto bg-gray-800/30 backdrop-blur-sm rounded-full mb-8 p-1">
            {['overall', 'game', 'help', 'realities', 'about'].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="rounded-full transition-all duration-300 text-white data-[state=active]:bg-white/10 data-[state=active]:text-white"
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {(activeTab === 'overall' || activeTab === 'game') && (
                <StatsSection
                  timeframe={timeframe}
                  setTimeframe={handleTimeframeChange}
                  stats={stats}
                  selectedGame={selectedGame}
                  setSelectedGame={handleGameChange}
                  activeTab={activeTab}
                  loading={loading}
                  error={error}
                  fetchStats={fetchStats}
                />
              )}
              {activeTab === 'help' && <InfoCard title="Help & Support" icon={FaQuestionCircle} />}
              {activeTab === 'realities' && <InfoCard title="Realities" icon={FaExclamationTriangle} />}
              {activeTab === 'about' && <InfoCard title="About Us" icon={FaInfoCircle} />}
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </div>
    </div>
  )
}

function useSlotMachineNumber(targetValue: number) {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(targetValue);
  const frameRef = useRef<number>();

  useEffect(() => {
    if (targetValue === previousValue.current) return;
    
    let startValue = 0;
    let currentStep = 0;
    const totalSteps = 30; // Number of animation steps
    const stepDuration = 1000 / totalSteps; // Total animation = 1 second
    
    const startAnimation = () => {
      currentStep++;
      
      if (currentStep <= totalSteps) {
        // During animation, show random numbers that get closer to target
        const progress = currentStep / totalSteps;
        const range = targetValue - startValue;
        const randomOffset = range * (1 - progress) * Math.random();
        const currentValue = Math.floor(startValue + (range * progress) + randomOffset);
        
        setDisplayValue(currentValue);
        frameRef.current = setTimeout(startAnimation, stepDuration) as unknown as number;
      } else {
        // Animation complete
        setDisplayValue(targetValue);
      }
    };

    startAnimation();
    previousValue.current = targetValue;

    return () => {
      if (frameRef.current) {
        clearTimeout(frameRef.current);
      }
    };
  }, [targetValue]);

  return displayValue;
}

function useAnimatedNumber(value: number, duration: number = 500) {
  const [current, setCurrent] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const frameRef = useRef<number>();

  useEffect(() => {
    startTimeRef.current = null;
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const progress = (timestamp - startTimeRef.current) / duration;

      if (progress < 1) {
        setCurrent(Math.floor(value * progress));
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setCurrent(value);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [value, duration]);

  return current;
}

function AnimatedBackground() {
  return (
    <div className="fixed inset-0 z-0">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjMjEyMTIxIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDVMNSAwWk02IDRMNCA2Wk0tMSAxTDEgLTFaIiBzdHJva2U9IiMxMTEiIHN0cm9rZS13aWR0aD0iMSI+PC9wYXRoPgo8L3N2Zz4=')]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
    </div>
  )
}

interface StatsSectionProps {
  timeframe: string
  setTimeframe: (timeframe: string) => void
  stats: GameStats | null
  selectedGame: string
  setSelectedGame: (game: string) => void
  activeTab: string
  loading: boolean
  error: string | null
  fetchStats: () => Promise<void>
}

function StatsSection({
  timeframe,
  setTimeframe,
  stats,
  selectedGame,
  setSelectedGame,
  activeTab,
  loading,
  error,
  fetchStats
}: StatsSectionProps) {
  const handleRefresh = async () => {
    await fetchStats();
  };

  return (
    <div className="space-y-8">
      {activeTab === 'game' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="max-w-md mx-auto">
            <Select onValueChange={setSelectedGame} value={selectedGame}>
              <SelectTrigger className="w-full bg-gray-800/30 border-gray-700/50 backdrop-blur-sm text-white">
                <SelectValue placeholder="Select a game" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                {games.map((game) => (
                  <SelectItem key={game} value={game.toLowerCase()}>
                    {game}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>
      )}

      <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-4 mb-8">
        <div className="flex justify-center space-x-4">
          {timeframes.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTimeframe(value)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all ${
                timeframe === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800/30 text-gray-300 hover:bg-gray-700/30'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all 
            ${loading 
              ? 'bg-gray-700/30 text-gray-500 cursor-not-allowed' 
              : 'bg-gray-800/30 text-gray-300 hover:bg-gray-700/30'
            }`}
        >
          <FaSync className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-8">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LoadingState />
          </motion.div>
        ) : stats ? (
          <motion.div
            key={`stats-${timeframe}-${selectedGame}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <StatsContent stats={stats} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-800/30 rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="h-96 bg-gray-800/30 rounded-lg animate-pulse" />
    </div>
  )
}

function StatsContent({ stats }: { stats: GameStats }) {
  // Calculate win/loss ratio with proper handling of edge cases
  const winLossRatio = (() => {
    if (stats.losses === 0) {
      return stats.wins > 0 ? "∞" : "0.00";
    }
    const ratio = stats.wins / stats.losses;
    return ratio.toFixed(2);
  })();

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <StatCard
          title="Games Played"
          value={stats.gamesPlayed}
          icon={FaDice}
        />
        <StatCard
          title="Wins"
          value={stats.wins}
          percentage={stats.winPercentage}
          icon={FaChartLine}
          trend="up"
        />
        <StatCard
          title="Losses"
          value={stats.losses}
          percentage={stats.lossPercentage}
          icon={FaChartLine}
          trend="down"
        />
        <StatCard
          title="Win/Loss Ratio"
          value={winLossRatio}
          icon={FaChartLine}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-8"
      >
        <Card className="bg-gray-800/30 border-gray-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Win/Loss Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              {stats && stats.wins !== null && stats.losses !== null && (
                <>
                  {console.log('Chart Data:', { wins: stats.wins, losses: stats.losses })}
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Wins', value: parseInt(String(stats.wins)) },
                        { name: 'Losses', value: parseInt(String(stats.losses)) }
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff22" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#fff"
                        axisLine={{ stroke: '#ffffff44' }}
                        tickLine={{ stroke: '#ffffff44' }}
                      />
                      <YAxis 
                        stroke="#fff"
                        axisLine={{ stroke: '#ffffff44' }}
                        tickLine={{ stroke: '#ffffff44' }}
                        domain={[0, 'auto']}
                      />
                      <Tooltip
                        contentStyle={{ background: 'rgba(39, 114, 245, 0.8)', border: 'none' }}
                        labelStyle={{ color: '#fff' }}
                        cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                        formatter={(value) => [parseInt(String(value)), 'Count']}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="url(#barGradient)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={100}
                      />
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.8} />
                          <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.2} />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </>
              )}
              {(!stats || stats.wins === null || stats.losses === null) && (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  )
}

interface StatCardProps {
  title: string
  value: number | string
  percentage?: number
  icon: IconType
  trend?: 'up' | 'down'
}

function StatCard({ title, value, percentage, icon: Icon, trend }: StatCardProps) {
  const isNumber = typeof value === 'number';
  const displayValue = useSlotMachineNumber(isNumber ? Number(value) : 0);

  return (
    <Card className="bg-gray-800/30 border-gray-700/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-white">{title}</CardTitle>
        <Icon className="h-4 w-4 text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white font-mono tabular-nums">
          {isNumber ? displayValue.toLocaleString() : value}
        </div>
        {percentage !== undefined && (
          <p className={`text-xs ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
            {trend === 'up' ? '+' : '-'}{percentage}%
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface InfoCardProps {
  title: string
  icon: IconType
}

function InfoCard({ title, icon: Icon }: InfoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-gray-800/30 border-gray-700/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Icon className="w-5 h-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">Content for {title} will be added here.</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}

