import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  AlertTriangle,
  CheckCircle,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  LayoutDashboard,
  FileText,
  Settings as SettingsIcon,
  ChevronRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { format } from "date-fns";

export default function DashboardPage() {
  const [activeWard, setActiveWard] = useState("all");


  const { data: rawResidents, isLoading } = useQuery({
    queryKey: ["residents"],
    queryFn: async () => {
      const response = await fetch("/api/residents");
      return response.json();
    },
  });

  // Ensure residents is always an array
  const residents = Array.isArray(rawResidents) ? rawResidents : [];

  const { data: rawAlerts } = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => {
      const response = await fetch("/api/alerts?status=open");
      return response.json();
    },
  });

  // Ensure alerts is always an array
  const alerts = Array.isArray(rawAlerts) ? rawAlerts : [];
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const inRangePercentage = 85; // Mock analytic

  return (
    <div className="flex h-screen bg-[#F9FAFB]">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-10">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Activity className="text-white" size={24} />
          </div>
          <span className="text-xl font-bold text-gray-900">CareGlucose</span>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem
            icon={<LayoutDashboard size={20} />}
            label="Overview"
            active
          />
          <NavItem icon={<Users size={20} />} label="Residents" />
          <NavItem icon={<AlertTriangle size={20} />} label="Alerts" />
          <NavItem icon={<FileText size={20} />} label="Reports" />
          <NavItem icon={<SettingsIcon size={20} />} label="Settings" />
        </nav>

        <div className="mt-auto p-4 bg-blue-50 rounded-xl">
          <p className="text-sm font-semibold text-blue-900">
            Clinician Portal
          </p>
          <p className="text-xs text-blue-700">Dr. Sarah Miller</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <header className="h-20 bg-white border-b border-gray-200 px-8 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-2xl font-bold text-gray-900">
            Facility Overview
          </h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search residents..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              New Resident
            </button>
          </div>
        </header>

        <main className="p-8 space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              label="Total Residents"
              value={residents.length}
              icon={<Users className="text-blue-600" />}
              trend="+2 this week"
            />
            <StatCard
              label="Critical Alerts"
              value={criticalAlerts.length}
              icon={<AlertTriangle className="text-red-600" />}
              trend="Requires action"
              critical
            />
            <StatCard
              label="In Range (TIR)"
              value={`${inRangePercentage}%`}
              icon={<Activity className="text-green-600" />}
              trend="+4.2% improvement"
            />
            <StatCard
              label="Completed Tasks"
              value="42/50"
              icon={<CheckCircle className="text-purple-600" />}
              trend="84% completion"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chart Area */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Glucose Trends (Cohort)
                </h2>
                <select className="border-none bg-gray-50 rounded-lg px-3 py-1 font-semibold text-gray-600">
                  <option>Last 7 Days</option>
                  <option>Last 24 Hours</option>
                </select>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={MOCK_CHART_DATA}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="avg"
                      stroke="#2563EB"
                      strokeWidth={3}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="max"
                      stroke="#EF4444"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Critical Residents List */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Critical Monitoring
              </h2>
              <div className="space-y-4 flex-1 overflow-y-auto">
                {residents
                  .filter((r) => r.status !== "stable")
                  .map((resident) => (
                    <div
                      key={resident.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${resident.status === "critical" ? "bg-red-500" : "bg-yellow-500"}`}
                        />
                        <div>
                          <p className="font-bold text-gray-900">
                            {resident.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {resident.room}
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-gray-400" />
                    </div>
                  ))}
              </div>
              <button className="w-full mt-6 py-2 text-blue-600 font-bold hover:bg-blue-50 rounded-lg transition-colors">
                View All Alerts
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active = false }) {
  return (
    <a
      href="#"
      className={`
      flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-colors
      ${active ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"}
    `}
    >
      {icon}
      <span>{label}</span>
    </a>
  );
}

function StatCard({ label, value, icon, trend, critical = false }) {
  return (
    <div
      className={`p-6 rounded-2xl bg-white border border-gray-200 shadow-sm ${critical ? "ring-2 ring-red-100" : ""}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-gray-50 rounded-xl">{icon}</div>
        <span
          className={`text-xs font-bold px-2 py-1 rounded-full ${trend.includes("+") ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}
        >
          {trend}
        </span>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-sm font-semibold text-gray-500 mt-1">{label}</p>
    </div>
  );
}

const MOCK_CHART_DATA = [
  { time: "Mon", avg: 110, max: 140 },
  { time: "Tue", avg: 125, max: 180 },
  { time: "Wed", avg: 115, max: 150 },
  { time: "Thu", avg: 140, max: 210 },
  { time: "Fri", avg: 120, max: 160 },
  { time: "Sat", avg: 110, max: 140 },
  { time: "Sun", avg: 105, max: 130 },
];
