"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  LayoutGrid,
  Download,
  Bell,
  Sparkles,
  FileText,
  FolderOpen,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/dashboard/Header";
import Footer from "@/components/dashboard/Footer";
import NewTemplates from "@/components/dashboard/Newtemplates";
import VisitingCards from "@/components/dashboard/visitingcards";
import Certificates from "@/components/dashboard/certificates";
import Aicreative from "@/components/dashboard/aicreative";
import Usernameheader from "@/components/dashboard/usernameheader"; // Import your new component

// Define the shape of a template object from the database
interface Template {
  _id: string;
  templateName: string;
  imageUrl: string;
}

// Card component for displaying a design thumbnail and title
const DesignCard = ({
  title,
  imageUrl,
  actionText,
  actionIcon,
}: {
  title: string;
  imageUrl: string;
  actionText: string;
  actionIcon: React.ReactNode;
}) => (
  <div className="group relative overflow-hidden rounded-xl bg-transparent border border-gray-300 shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl cursor-pointer">
    {imageUrl && (
      <img
        src={imageUrl}
        alt={title}
        className="w-full h-auto rounded-t-xl object-cover transition-opacity duration-300 group-hover:opacity-80"
      />
    )}
    <div className="absolute inset-0 bg-black/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-center justify-center">
      <button className="bg-white/90 text-gray-900 font-semibold px-6 py-2 rounded-full flex items-center gap-2 transform transition-transform duration-300 group-hover:scale-100 scale-90 cursor-pointer">
        {actionIcon}
        <span>{actionText}</span>
      </button>
    </div>
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-900 truncate">{title}</h3>
    </div>
  </div>
);

// A simple metric card component for analytics
const MetricCard = ({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) => (
  <div
    className={`p-4 rounded-xl shadow-md border border-gray-300 flex flex-col items-start gap-2 bg-transparent transition-transform duration-300 hover:scale-[1.03] hover:shadow-xl cursor-pointer`}
  >
    <div className={`p-2 rounded-full text-white ${color}`}>{icon}</div>
    <h4 className="text-xl font-bold text-gray-900 mt-2">{value}</h4>
    <p className="text-sm text-gray-600">{title}</p>
  </div>
);

export default function DashboardPage() {
  const { user } = useAuth();
  const [newTemplates, setNewTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch templates on mount
  useEffect(() => {
    async function fetchTemplates() {
      try {
        const response = await fetch("/api/templates");
        if (!response.ok) throw new Error("Templates fetch failed");
        const data = await response.json();
        setNewTemplates(data.data);
      } catch (err: any) {
        setError(err.message);
        console.error("Failed to fetch templates:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTemplates();
  }, []);

  return (
    <main className="flex-1 min-h-screen px-4 sm:px-6 lg:px-12 xl:px-20 transition-all duration-300 bg-transparent text-gray-900">
      {/* --- Header --- */}
      <div className="my-4 cursor-pointer hidden lg:block">
        <Header />
      </div>
      <Usernameheader/>

      {/* --- Advanced Analytics --- */}
<section className="mb-12">
  <h2 className="text-xl font-semibold mb-6">Advanced Analytics</h2>
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
    <MetricCard
      title="Projects Created"
      value="0"
      icon={<Sparkles size={24} className="text-yellow-500" />}
      color="bg-yellow-100"
    />
    <MetricCard
      title="Total Downloads"
      value="0"
      icon={<Download size={24} className="text-blue-500" />}
      color="bg-blue-100"
    />
    <MetricCard
      title="Projects Contributed"
      value="0"
      icon={<FolderOpen size={24} className="text-green-500" />}
      color="bg-green-100"
    />
    <MetricCard
      title="Total Uploads"
      value="0"
      icon={<Plus size={24} className="text-purple-500" />}
      color="bg-purple-100"
    />
  </div>
</section>

      {/* --- Quick Actions --- */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <button className="flex items-center justify-center gap-2 p-4 rounded-xl bg-blue-600/30 border border-blue-400/40 shadow-md text-gray-900 font-semibold hover:bg-blue-600/50 transition-all duration-300 active:scale-[0.98] cursor-pointer">
            <Plus size={20} />
            <span>Create New Poster</span>
          </button>
          <button className="flex items-center justify-center gap-2 p-4 rounded-xl bg-purple-600/30 border border-purple-400/40 shadow-md text-gray-900 font-semibold hover:bg-purple-600/50 transition-all duration-300 active:scale-[0.98] cursor-pointer">
            <FileText size={20} />
            <span>Generate Visiting Card</span>
          </button>
          <button className="flex items-center justify-center gap-2 p-4 rounded-xl bg-teal-600/30 border border-teal-400/40 shadow-md text-gray-900 font-semibold hover:bg-teal-600/50 transition-all duration-300 active:scale-[0.98] cursor-pointer">
            <LayoutGrid size={20} />
            <span>Manage Templates</span>
          </button>
          <button className="flex items-center justify-center gap-2 p-4 rounded-xl bg-red-600/30 border border-red-400/40 shadow-md text-gray-900 font-semibold hover:bg-red-600/50 transition-all duration-300 active:scale-[0.98] cursor-pointer">
            <Bell size={20} />
            <span>View Notifications</span>
          </button>
        </div>
      </section>

      {/* --- Newest Templates --- */}
      <NewTemplates />

      {/* --- Visiting Cards --- */}
      <div className="mt-8">
        <VisitingCards />
      </div>

      {/* --- Certificates --- */}
      <div className="mt-8">
        <Certificates/>
      </div>

      {/* --- AI Creative --- */}
      <div className="mt-8">
        <Aicreative/>
      </div>

      {/* --- Footer --- */}
      <Footer />
    </main>
  );
}
