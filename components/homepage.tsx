"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence, animate } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts'
import { FaClock, FaCalendarAlt, FaChartLine, FaDice, FaQuestionCircle, FaInfoCircle, FaExclamationTriangle, FaSync, FaDownload } from 'react-icons/fa'
import { FaHome, FaTelegram, FaYoutube, FaTwitter } from 'react-icons/fa'
import { IconType } from 'react-icons'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'
import { FloatingDock } from "@/components/ui/floating-dock"

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


function AnimatedNumber({ value, isRatio = false }: { value: number | string, isRatio?: boolean }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // Convert string numbers with commas to numbers
    const targetValue = typeof value === 'string' ? 
      Number(value.replace(/,/g, '')) : 
      Number(value);

    if (isNaN(targetValue)) return;

    let startTimestamp: number;
    const duration = 1500;
    
    const animate = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      const currentValue = progress * targetValue;
      setDisplayValue(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value]);

  if (isRatio) {
    return <span>{displayValue.toFixed(2)}</span>;
  }
  return <span>{Math.round(displayValue).toLocaleString()}</span>;
}

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

    const intervalId = setInterval(fetchStats, 60000) // Update every 60 seconds

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
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
      <AnimatedBackground />
      <div className="container mx-auto px-4 py-8 relative z-10">
        <StatsSection
          timeframe={timeframe}
          setTimeframe={setTimeframe}
          stats={stats}
          selectedGame={selectedGame}
          setSelectedGame={setSelectedGame}
          activeTab={activeTab}
          loading={loading}
          error={error}
          fetchStats={fetchStats}
        />
        <BottomNav />
      </div>
    </div>
  )
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
  const [exportLoading, setExportLoading] = useState(false);

  const fetchGameStats = async (game: string) => {
    try {
      const response = await fetch(`/api/proxy/stats/game/${timeframe}/${game.toLowerCase()}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) throw new Error(`Error fetching ${game} stats`);
      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${game} stats:`, error);
      return null;
    }
  };

  const exportData = async () => {
    if (!stats) return;
    setExportLoading(true);

    try {
      // Fetch stats for all games
      const gameStats = await Promise.all(
        games.map(async (game) => ({
          game,
          stats: await fetchGameStats(game)
        }))
      );

      // Create CSV content
      const csvRows = [
        ['Stake Statistics Export'],
        ['Generated at:', new Date().toLocaleString()],
        ['Timeframe:', timeframe],
        [''],
        ['Overall Statistics'],
        ['Metric', 'Value', 'Percentage'],
        ['Games Played', stats.gamesPlayed.toLocaleString(), ''],
        ['Wins', stats.wins.toLocaleString(), `${stats.winPercentage}%`],
        ['Losses', stats.losses.toLocaleString(), `${stats.lossPercentage}%`],
        ['Win/Loss Ratio', (stats.wins / stats.losses).toFixed(2), ''],
        [''],
        ['Individual Game Statistics'],
        ['Game', 'Games Played', 'Wins', 'Losses', 'Win %', 'Loss %', 'Win/Loss Ratio']
      ];

      // Add stats for each game
      gameStats.forEach(({ game, stats: gameData }) => {
        if (gameData) {
          const ratio = gameData.losses > 0 ? (gameData.wins / gameData.losses).toFixed(2) : gameData.wins > 0 ? '∞' : '0.00';
          csvRows.push([
            game,
            gameData.gamesPlayed.toLocaleString(),
            gameData.wins.toLocaleString(),
            gameData.losses.toLocaleString(),
            `${gameData.winPercentage}%`,
            `${gameData.lossPercentage}%`,
            ratio
          ]);
        }
      });

      const csvContent = csvRows.map(row => row.join(',')).join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `stake-complete-stats-${timeframe}-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchStats();
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          Stake.com Statistics
        </h1>
        <p className="text-gray-400 mb-2">Unveiling the truth behind the numbers</p>
        <div className="text-sm text-gray-400 mt-4">
          Made by <a href="https://discord.gg/v9suegvMpY" className="underline decoration-gray-400 hover:text-gray-300">nexora.dev</a> with ❤️
        </div>
      </motion.div>

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
        <button
          onClick={exportData}
          disabled={exportLoading}
          className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-lg hover:shadow-blue-500/25 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
        >
          <FaDownload className={`w-4 h-4 ${exportLoading ? 'animate-spin' : ''}`} />
          <span>{exportLoading ? 'Exporting...' : 'Export All Data'}</span>
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
  const calculateWinLossRatio = (wins: number | string, losses: number | string): number => {
    console.log('Raw wins:', wins, 'Raw losses:', losses);
    
    // Convert string numbers with commas to actual numbers if needed
    const cleanWins = typeof wins === 'string' ? parseInt(wins.replace(/,/g, ''), 10) : wins;
    const cleanLosses = typeof losses === 'string' ? parseInt(losses.replace(/,/g, ''), 10) : losses;
    
    console.log('Cleaned wins:', cleanWins, 'Cleaned losses:', cleanLosses);

    if (cleanLosses === 0) {
      return cleanWins > 0 ? 999.99 : 0;
    }
    
    const ratio = cleanWins / cleanLosses;
    console.log('Calculated ratio:', ratio);
    return Number(ratio.toFixed(2));
  };

  const gamesPlayed = stats?.gamesPlayed ?? 0;
  const wins = stats?.wins ?? 0;
  const losses = stats?.losses ?? 0;
  const winLossRatio = calculateWinLossRatio(wins, losses);

  console.log('Final ratio:', winLossRatio);

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
          value={gamesPlayed}
          icon={FaDice}
        />
        <StatCard
          title="Wins"
          value={wins}
          percentage={stats?.winPercentage}
          icon={FaChartLine}
          trend="up"
        />
        <StatCard
          title="Losses"
          value={losses}
          percentage={stats?.lossPercentage}
          icon={FaChartLine}
          trend="down"
        />
        <StatCard
          title="Win/Loss Ratio"
          value={winLossRatio}
          icon={FaChartLine}
          isRatio={true}
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
  isRatio?: boolean
}

function StatCard({ title, value, percentage, icon: Icon, trend, isRatio }: StatCardProps) {
  return (
    <Card className="bg-gray-800/30 border-gray-700/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-white">{title}</CardTitle>
        <Icon className="h-4 w-4 text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white font-mono tabular-nums">
          <AnimatedNumber value={value} isRatio={isRatio} />
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
  title: string;
  value: string | number;
  icon: IconType;
  isRatio?: boolean;
}

function InfoCard({ title, value, icon: Icon, isRatio = false }: InfoCardProps) {
  let displayValue = value;
  if (typeof value === 'string') {
    // Remove commas and convert to number if it's a string with commas
    displayValue = value.replace(/,/g, '');
  }

  return (
    <Card className="bg-gray-800/30 backdrop-blur-sm border-0">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle>
        <Icon className="w-4 h-4 text-gray-400" />
      </CardHeader>
      <CardContent>
        <AnimatedNumber value={displayValue} isRatio={isRatio} />
      </CardContent>
    </Card>
  )
}

function BottomNav() {
  const navItems = [
    {
      title: "Home",
      href: "/",
      icon: <FaHome className="h-full w-full text-white" />,
    },
    {
      title: "Telegram",
      href: "https://t.me/yourgroup",
      icon: <FaTelegram className="h-full w-full text-white" />,
    },
    {
      title: "YouTube",
      href: "https://www.youtube.com/c/yourchannel",
      icon: <FaYoutube className="h-full w-full text-white" />,
    },
    {
      title: "Twitter",
      href: "https://twitter.com/yourhandle",
      icon: <FaTwitter className="h-full w-full text-white" />,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-6">
      <FloatingDock 
        items={navItems}
        desktopClassName="hidden md:flex"
        mobileClassName="block md:hidden"
      />
    </div>
  );
}
