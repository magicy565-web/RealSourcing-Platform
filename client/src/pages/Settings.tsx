import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import {
  User, Bell, Shield, Globe, Palette, Link2, Trash2, Save,
  Camera, Check, ChevronRight, Mail, Phone, MapPin, Building2,
  Eye, EyeOff, Smartphone, Loader2, Sparkles, Target, TrendingUp,
  ShoppingBag, AlertTriangle, DollarSign, Tag, X
} from "lucide-react";

type SettingsTab = "profile" | "business_profile" | "notifications" | "security" | "preferences" | "integrations";

const GRID_BG = `
  linear-gradient(rgba(124, 58, 237, 0.03) 1px, transparent 1px),
  linear-gradient(90deg, rgba(124, 58, 237, 0.03) 1px, transparent 1px)
`;

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
  { id: "business_profile", label: "Business Profile", icon: <Sparkles className="w-4 h-4" /> },
  { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
  { id: "security", label: "Security", icon: <Shield className="w-4 h-4" /> },
  { id: "preferences", label: "Preferences", icon: <Palette className="w-4 h-4" /> },
  { id: "integrations", label: "Integrations", icon: <Link2 className="w-4 h-4" /> },
];

const NOTIFICATION_SETTINGS = [
  { id: "new_inquiry", label: "New Inquiry Reply", desc: "When a factory replies to your inquiry", email: true, push: true, sms: false },
  { id: "webinar_reminder", label: "Webinar Reminder", desc: "30 minutes before a webinar starts", email: true, push: true, sms: true },
  { id: "meeting_invite", label: "Meeting Invitation", desc: "When you receive a meeting invite", email: true, push: true, sms: false },
  { id: "product_update", label: "Product Updates", desc: "Price changes on favorited products", email: false, push: true, sms: false },
  { id: "ai_insight", label: "AI Insights", desc: "Weekly sourcing insights from AI", email: true, push: false, sms: false },
  { id: "quota_alert", label: "Quota Alerts", desc: "When usage reaches 80% of limit", email: true, push: true, sms: false },
];

const INTEGRATIONS = [
  { id: "slack", name: "Slack", icon: "💬", desc: "Get notifications in your Slack workspace", connected: true },
  { id: "salesforce", name: "Salesforce", icon: "☁️", desc: "Sync inquiries with your CRM", connected: false },
  { id: "hubspot", name: "HubSpot", icon: "🧡", desc: "Manage contacts and deals", connected: false },
  { id: "zapier", name: "Zapier", icon: "⚡", desc: "Connect with 5000+ apps", connected: false },
];

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    onClick={onChange}
    className="w-10 h-6 rounded-full transition-all duration-200 relative flex-shrink-0"
    style={{ background: checked ? "linear-gradient(135deg, #7c3aed, #4f46e5)" : "rgba(255,255,255,0.12)" }}
  >
    <div
      className="absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-200 shadow-sm"
      style={{ left: checked ? "1.25rem" : "0.25rem" }}
    />
  </button>
);

const InputField = ({ icon: Icon, label, value, onChange, type = "text", disabled = false, placeholder = "" }: any) => (
  <div>
    <label className="text-xs font-medium mb-1.5 block" style={{ color: "rgba(255,255,255,0.40)" }}>{label}</label>
    <div className="relative">
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.25)" }} />
      <input
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 h-10 rounded-xl text-sm text-white outline-none transition-all"
        style={{
          background: disabled ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.09)",
          color: disabled ? "rgba(255,255,255,0.30)" : "white",
        }}
        onFocus={(e) => !disabled && (e.target.style.borderColor = "rgba(124,58,237,0.55)")}
        onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.09)")}
      />
    </div>
  </div>
);

export default function Settings() {
  const { user } = useAuth();
  const search = useSearch();
  const initialTab = (() => {
    const params = new URLSearchParams(search);
    const tab = params.get("tab");
    const validTabs: SettingsTab[] = ["profile", "business_profile", "notifications", "security", "preferences", "integrations"];
    return validTabs.includes(tab as SettingsTab) ? (tab as SettingsTab) : "profile";
  })();
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [notifications, setNotifications] = useState(
    NOTIFICATION_SETTINGS.reduce((acc, n) => ({
      ...acc,
      [n.id]: { email: n.email, push: n.push, sms: n.sms }
    }), {} as Record<string, { email: boolean; push: boolean; sms: boolean }>)
  );

  const { data: profileData, isLoading: profileLoading } = trpc.profile.get.useQuery();
  const updateProfileMutation = trpc.profile.update.useMutation({
    onSuccess: () => toast.success("Profile saved successfully!"),
    onError: (err) => toast.error(`Failed to save: ${err.message}`),
  });

  // Business Profile
  const utils = trpc.useUtils();
  const { data: bizProfile, isLoading: bizProfileLoading } = trpc.businessProfile.get.useQuery(undefined, {
    retry: false,
    staleTime: 2 * 60 * 1000,
  });
  const saveOnboardingMutation = trpc.businessProfile.saveOnboarding.useMutation({
    onSuccess: () => {
      toast.success("Business profile updated!");
      utils.businessProfile.get.invalidate();
    },
    onError: (err) => toast.error(`Failed to save: ${err.message}`),
  });

  const [bizForm, setBizForm] = useState({
    ambition: "",
    businessStage: "",
    targetPlatforms: [] as string[],
    budget: "",
    interestedNiches: [] as string[],
    mainChallenge: "",
  });

  useEffect(() => {
    if (bizProfile) {
      const parsePlatforms = () => {
        try {
          const raw = bizProfile.targetPlatforms;
          if (Array.isArray(raw)) return raw;
          if (typeof raw === "string") return JSON.parse(raw);
          return [];
        } catch { return []; }
      };
      const parseNiches = () => {
        try {
          const raw = bizProfile.interestedNiches;
          if (Array.isArray(raw)) return raw;
          if (typeof raw === "string") return JSON.parse(raw);
          return [];
        } catch { return []; }
      };
      setBizForm({
        ambition: bizProfile.ambition || "",
        businessStage: bizProfile.businessStage || "",
        targetPlatforms: parsePlatforms(),
        budget: bizProfile.budget || "",
        interestedNiches: parseNiches(),
        mainChallenge: bizProfile.mainChallenge || "",
      });
    }
  }, [bizProfile]);

  const handleSaveBizProfile = () => {
    if (!bizForm.ambition || !bizForm.businessStage || !bizForm.budget || !bizForm.mainChallenge) {
      toast.error("Please fill in all required fields");
      return;
    }
    saveOnboardingMutation.mutate(bizForm);
  };

  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    company: "",
    location: "",
    bio: "",
    language: "English",
    timezone: "America/Los_Angeles",
  });

  useEffect(() => {
    if (profileData) {
      setProfile((prev) => ({
        ...prev,
        name: profileData.name || prev.name,
        email: profileData.email || prev.email,
      }));
    }
  }, [profileData]);

  const handleSave = () => updateProfileMutation.mutate({ name: profile.name });
  const toggleNotification = (id: string, channel: "email" | "push" | "sms") => {
    setNotifications((prev) => ({ ...prev, [id]: { ...prev[id], [channel]: !prev[id][channel] } }));
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #050310 0%, #080820 50%, #050310 100%)" }}>
      <div className="fixed inset-0 pointer-events-none"
        style={{ backgroundImage: GRID_BG, backgroundSize: "40px 40px" }} />

      <div className="relative z-10 max-w-5xl mx-auto p-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-black text-white">Settings</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>Manage your account preferences and configurations</p>
        </motion.div>

        <div className="flex gap-6">
          {/* Sidebar Nav */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-52 flex-shrink-0"
          >
            <div className="rounded-2xl p-2 space-y-1"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(20px)" }}>
              {TABS.map((tab) => (
                <motion.button
                  key={tab.id}
                  whileHover={{ x: 2 }}
                  onClick={() => setActiveTab(tab.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: activeTab === tab.id ? "rgba(124,58,237,0.20)" : "transparent",
                    color: activeTab === tab.id ? "#c4b5fd" : "rgba(255,255,255,0.40)",
                    border: activeTab === tab.id ? "1px solid rgba(124,58,237,0.30)" : "1px solid transparent",
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 rounded-2xl p-6"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(20px)" }}
          >
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <h2 className="font-bold text-lg text-white">Profile Information</h2>
                {profileLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black text-white"
                          style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
                          {(profile.name || "U").slice(0, 2).toUpperCase()}
                        </div>
                        <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-lg"
                          style={{ background: "#7c3aed" }}>
                          <Camera className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                      <div>
                        <p className="font-semibold text-white">{profile.name}</p>
                        <p className="text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>{profile.email}</p>
                        <button className="text-xs text-violet-400 hover:text-violet-300 mt-1 transition-colors">Change avatar</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <InputField icon={User} label="Full Name" value={profile.name} onChange={(e: any) => setProfile({ ...profile, name: e.target.value })} />
                      <InputField icon={Mail} label="Email" value={profile.email} onChange={(e: any) => setProfile({ ...profile, email: e.target.value })} disabled />
                      <InputField icon={Phone} label="Phone" value={profile.phone} onChange={(e: any) => setProfile({ ...profile, phone: e.target.value })} />
                      <InputField icon={Building2} label="Company" value={profile.company} onChange={(e: any) => setProfile({ ...profile, company: e.target.value })} />
                      <div className="col-span-2">
                        <InputField icon={MapPin} label="Location" value={profile.location} onChange={(e: any) => setProfile({ ...profile, location: e.target.value })} />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-medium mb-1.5 block" style={{ color: "rgba(255,255,255,0.40)" }}>Bio</label>
                        <textarea
                          value={profile.bio}
                          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-2.5 rounded-xl text-sm text-white resize-none outline-none transition-all"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
                          onFocus={(e) => e.target.style.borderColor = "rgba(124,58,237,0.55)"}
                          onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.09)"}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={handleSave}
                        disabled={updateProfileMutation.isPending}
                        className="h-10 px-5 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
                        style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                      >
                        {updateProfileMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <><Save className="w-4 h-4" />Save Changes</>}
                      </motion.button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <h2 className="font-bold text-lg text-white">Notification Preferences</h2>
                <div className="overflow-hidden rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}>
                        <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "rgba(255,255,255,0.40)" }}>Notification</th>
                        {["Email", "Push", "SMS"].map((ch) => (
                          <th key={ch} className="text-center px-4 py-3 text-xs font-semibold" style={{ color: "rgba(255,255,255,0.40)" }}>
                            <div className="flex items-center justify-center gap-1.5">
                              {ch === "Email" && <Mail className="w-3.5 h-3.5" />}
                              {ch === "Push" && <Smartphone className="w-3.5 h-3.5" />}
                              {ch === "SMS" && <Phone className="w-3.5 h-3.5" />}
                              {ch}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {NOTIFICATION_SETTINGS.map((n, i) => (
                        <tr key={n.id} style={{ borderBottom: i < NOTIFICATION_SETTINGS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                          <td className="px-4 py-4">
                            <div className="font-medium text-sm text-white">{n.label}</div>
                            <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.30)" }}>{n.desc}</div>
                          </td>
                          {(["email", "push", "sms"] as const).map((ch) => (
                            <td key={ch} className="px-4 py-4 text-center">
                              <div className="flex justify-center">
                                <Toggle checked={notifications[n.id]?.[ch]} onChange={() => toggleNotification(n.id, ch)} />
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => toast.success("Notification preferences saved!")}
                    className="h-10 px-5 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                  >
                    <Save className="w-4 h-4" />Save Preferences
                  </motion.button>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <h2 className="font-bold text-lg text-white">Security Settings</h2>
                <div className="rounded-xl p-5 space-y-4"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <h3 className="font-semibold text-white">Change Password</h3>
                  {[
                    { label: "Current Password", show: showCurrentPassword, toggle: () => setShowCurrentPassword(!showCurrentPassword) },
                    { label: "New Password", show: showNewPassword, toggle: () => setShowNewPassword(!showNewPassword) },
                  ].map(({ label, show, toggle }) => (
                    <div key={label}>
                      <label className="text-xs font-medium mb-1.5 block" style={{ color: "rgba(255,255,255,0.40)" }}>{label}</label>
                      <div className="relative">
                        <input
                          type={show ? "text" : "password"}
                          placeholder={`Enter ${label.toLowerCase()}`}
                          className="w-full pl-4 pr-10 h-10 rounded-xl text-sm text-white outline-none"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
                          onFocus={(e) => e.target.style.borderColor = "rgba(124,58,237,0.55)"}
                          onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.09)"}
                        />
                        <button onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2"
                          style={{ color: "rgba(255,255,255,0.30)" }}>
                          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  ))}
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => toast.success("Password updated!")}
                    className="h-10 px-5 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                  >
                    <Shield className="w-4 h-4" />Update Password
                  </motion.button>
                </div>
                <div className="rounded-xl p-5 flex items-center justify-between"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div>
                    <h3 className="font-semibold text-white">Two-Factor Authentication</h3>
                    <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>Add an extra layer of security to your account</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    className="h-9 px-4 rounded-xl text-sm font-medium"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.60)" }}
                  >
                    Enable 2FA
                  </motion.button>
                </div>
                <div className="rounded-xl p-5"
                  style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
                  <h3 className="font-semibold text-red-400 mb-2">Danger Zone</h3>
                  <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>Permanently delete your account and all associated data.</p>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    className="h-9 px-4 rounded-xl text-sm font-medium flex items-center gap-2"
                    style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}
                  >
                    <Trash2 className="w-4 h-4" />Delete Account
                  </motion.button>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === "preferences" && (
              <div className="space-y-6">
                <h2 className="font-bold text-lg text-white">Display Preferences</h2>
                <div className="space-y-3">
                  {[
                    { label: "Language", desc: "Interface language", options: ["English", "中文", "日本語", "한국어"], value: profile.language, key: "language" },
                    { label: "Timezone", desc: "Used for webinar times and meeting scheduling", options: ["America/Los_Angeles (UTC-8)", "America/New_York (UTC-5)", "Europe/London (UTC+0)", "Asia/Shanghai (UTC+8)"], value: profile.timezone, key: "timezone" },
                    { label: "Currency", desc: "Display prices in your preferred currency", options: ["USD ($)", "EUR (€)", "GBP (£)", "CNY (¥)"], value: "USD ($)", key: "currency" },
                  ].map((pref) => (
                    <div key={pref.label} className="flex items-center justify-between p-4 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <div>
                        <p className="font-medium text-white text-sm">{pref.label}</p>
                        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{pref.desc}</p>
                      </div>
                      <select
                        className="px-3 py-1.5 rounded-xl text-sm text-white outline-none"
                        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
                      >
                        {pref.options.map((opt) => <option key={opt} style={{ background: "#0f0c1a" }}>{opt}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => toast.success("Preferences saved!")}
                    className="h-10 px-5 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                  >
                    <Save className="w-4 h-4" />Save Preferences
                  </motion.button>
                </div>
              </div>
            )}

            {/* Business Profile Tab */}
            {activeTab === "business_profile" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-lg text-white">Business Profile</h2>
                    <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>Update your sourcing goals and preferences — this personalizes your AI Coach recommendations.</p>
                  </div>
                  {bizProfile && (
                    <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full" style={{ background: "rgba(74,222,128,0.10)", color: "#4ade80" }}>
                      <Check className="w-3 h-3" />Profile Active
                    </span>
                  )}
                </div>

                {bizProfileLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Goal */}
                    <div>
                      <label className="text-xs font-semibold mb-2 block flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.50)" }}>
                        <Target className="w-3.5 h-3.5 text-purple-400" />Your Goal <span className="text-red-400">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: "side_income", label: "Earn Side Income", sub: "$500–$2,000 / month" },
                          { value: "full_time", label: "Go Full-Time", sub: "$5,000–$20,000 / month" },
                          { value: "dtc_brand", label: "Build a DTC Brand", sub: "Long-term brand" },
                          { value: "learn", label: "Explore & Learn", sub: "Understand dropshipping" },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setBizForm({ ...bizForm, ambition: opt.value })}
                            className="text-left p-3 rounded-xl transition-all"
                            style={{
                              background: bizForm.ambition === opt.value ? "rgba(124,58,237,0.20)" : "rgba(255,255,255,0.03)",
                              border: bizForm.ambition === opt.value ? "1px solid rgba(124,58,237,0.45)" : "1px solid rgba(255,255,255,0.07)",
                            }}
                          >
                            <p className="text-sm font-semibold" style={{ color: bizForm.ambition === opt.value ? "#c4b5fd" : "rgba(255,255,255,0.70)" }}>{opt.label}</p>
                            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.30)" }}>{opt.sub}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Stage */}
                    <div>
                      <label className="text-xs font-semibold mb-2 block flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.50)" }}>
                        <TrendingUp className="w-3.5 h-3.5 text-purple-400" />Current Stage <span className="text-red-400">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: "newbie", label: "Complete Beginner", sub: "Never sold online" },
                          { value: "has_idea", label: "Have an Idea", sub: "No store yet" },
                          { value: "has_store", label: "Have a Store", sub: "Need better products" },
                          { value: "already_selling", label: "Already Selling", sub: "Want to scale up" },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setBizForm({ ...bizForm, businessStage: opt.value })}
                            className="text-left p-3 rounded-xl transition-all"
                            style={{
                              background: bizForm.businessStage === opt.value ? "rgba(124,58,237,0.20)" : "rgba(255,255,255,0.03)",
                              border: bizForm.businessStage === opt.value ? "1px solid rgba(124,58,237,0.45)" : "1px solid rgba(255,255,255,0.07)",
                            }}
                          >
                            <p className="text-sm font-semibold" style={{ color: bizForm.businessStage === opt.value ? "#c4b5fd" : "rgba(255,255,255,0.70)" }}>{opt.label}</p>
                            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.30)" }}>{opt.sub}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Budget */}
                    <div>
                      <label className="text-xs font-semibold mb-2 block flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.50)" }}>
                        <DollarSign className="w-3.5 h-3.5 text-purple-400" />Starting Budget <span className="text-red-400">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: "under_500", label: "Under $500" },
                          { value: "500_2000", label: "$500 – $2,000" },
                          { value: "2000_10000", label: "$2,000 – $10,000" },
                          { value: "over_10000", label: "$10,000+" },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setBizForm({ ...bizForm, budget: opt.value })}
                            className="p-3 rounded-xl text-sm font-semibold transition-all"
                            style={{
                              background: bizForm.budget === opt.value ? "rgba(124,58,237,0.20)" : "rgba(255,255,255,0.03)",
                              border: bizForm.budget === opt.value ? "1px solid rgba(124,58,237,0.45)" : "1px solid rgba(255,255,255,0.07)",
                              color: bizForm.budget === opt.value ? "#c4b5fd" : "rgba(255,255,255,0.60)",
                            }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sales Platform */}
                    <div>
                      <label className="text-xs font-semibold mb-2 block flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.50)" }}>
                        <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />Sales Platforms <span className="text-white/25 text-xs font-normal">(select all that apply)</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: "shopify", label: "Shopify" },
                          { value: "tiktok", label: "TikTok Shop" },
                          { value: "amazon", label: "Amazon" },
                          { value: "etsy", label: "Etsy" },
                          { value: "woocommerce", label: "WooCommerce" },
                          { value: "not_sure", label: "Not Decided" },
                        ].map((opt) => {
                          const selected = bizForm.targetPlatforms.includes(opt.value);
                          return (
                            <button
                              key={opt.value}
                              onClick={() => setBizForm({
                                ...bizForm,
                                targetPlatforms: selected
                                  ? bizForm.targetPlatforms.filter((p) => p !== opt.value)
                                  : [...bizForm.targetPlatforms, opt.value],
                              })}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                              style={{
                                background: selected ? "rgba(124,58,237,0.20)" : "rgba(255,255,255,0.04)",
                                border: selected ? "1px solid rgba(124,58,237,0.45)" : "1px solid rgba(255,255,255,0.09)",
                                color: selected ? "#c4b5fd" : "rgba(255,255,255,0.50)",
                              }}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Product Niches */}
                    <div>
                      <label className="text-xs font-semibold mb-2 block flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.50)" }}>
                        <Tag className="w-3.5 h-3.5 text-purple-400" />Product Niches <span className="text-white/25 text-xs font-normal">(select all that apply)</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: "home_goods", label: "Home & Living" },
                          { value: "beauty", label: "Beauty & Skincare" },
                          { value: "pet_supplies", label: "Pet Supplies" },
                          { value: "sports_fitness", label: "Sports & Fitness" },
                          { value: "baby_kids", label: "Baby & Kids" },
                          { value: "gadgets", label: "Gadgets & Tech" },
                          { value: "fashion", label: "Apparel & Fashion" },
                          { value: "outdoor", label: "Outdoor & Garden" },
                          { value: "kitchen", label: "Kitchen & Dining" },
                          { value: "health_wellness", label: "Health & Wellness" },
                          { value: "toys_games", label: "Toys & Games" },
                          { value: "automotive", label: "Automotive" },
                        ].map((opt) => {
                          const selected = bizForm.interestedNiches.includes(opt.value);
                          return (
                            <button
                              key={opt.value}
                              onClick={() => setBizForm({
                                ...bizForm,
                                interestedNiches: selected
                                  ? bizForm.interestedNiches.filter((n) => n !== opt.value)
                                  : [...bizForm.interestedNiches, opt.value],
                              })}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                              style={{
                                background: selected ? "rgba(124,58,237,0.20)" : "rgba(255,255,255,0.04)",
                                border: selected ? "1px solid rgba(124,58,237,0.45)" : "1px solid rgba(255,255,255,0.09)",
                                color: selected ? "#c4b5fd" : "rgba(255,255,255,0.50)",
                              }}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Main Challenge */}
                    <div>
                      <label className="text-xs font-semibold mb-2 block flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.50)" }}>
                        <AlertTriangle className="w-3.5 h-3.5 text-purple-400" />Main Challenge <span className="text-red-400">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: "finding_products", label: "Finding Winning Products", sub: "Don't know what will sell" },
                          { value: "finding_suppliers", label: "Finding Reliable Suppliers", sub: "Quality & scam concerns" },
                          { value: "marketing", label: "Marketing & Traffic", sub: "Can't get customers" },
                          { value: "operations", label: "Managing Operations", sub: "Orders & returns" },
                          { value: "capital", label: "Limited Budget", sub: "Not sure I can afford it" },
                          { value: "knowledge", label: "Lack of Knowledge", sub: "Don't know where to start" },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setBizForm({ ...bizForm, mainChallenge: opt.value })}
                            className="text-left p-3 rounded-xl transition-all"
                            style={{
                              background: bizForm.mainChallenge === opt.value ? "rgba(124,58,237,0.20)" : "rgba(255,255,255,0.03)",
                              border: bizForm.mainChallenge === opt.value ? "1px solid rgba(124,58,237,0.45)" : "1px solid rgba(255,255,255,0.07)",
                            }}
                          >
                            <p className="text-sm font-semibold" style={{ color: bizForm.mainChallenge === opt.value ? "#c4b5fd" : "rgba(255,255,255,0.70)" }}>{opt.label}</p>
                            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.30)" }}>{opt.sub}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Changes will update your AI Coach recommendations immediately.</p>
                      <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={handleSaveBizProfile}
                        disabled={saveOnboardingMutation.isPending}
                        className="h-10 px-5 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
                        style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                      >
                        {saveOnboardingMutation.isPending
                          ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</>
                          : <><Save className="w-4 h-4" />Save Business Profile</>}
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Integrations Tab */}
            {activeTab === "integrations" && (
              <div className="space-y-6">
                <h2 className="font-bold text-lg text-white">Integrations</h2>
                <div className="space-y-3">
                  {INTEGRATIONS.map((integration) => (
                    <motion.div
                      key={integration.id}
                      whileHover={{ x: 2 }}
                      className="flex items-center justify-between p-4 rounded-xl transition-all"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                          style={{ background: "rgba(255,255,255,0.06)" }}>
                          {integration.icon}
                        </div>
                        <div>
                          <p className="font-semibold text-white text-sm">{integration.name}</p>
                          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{integration.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {integration.connected && (
                          <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                            style={{ background: "rgba(74,222,128,0.10)", color: "#4ade80" }}>
                            <Check className="w-3 h-3" />Connected
                          </span>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                          className="h-8 px-3 rounded-xl text-xs font-medium flex items-center gap-1"
                          style={{
                            background: integration.connected ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.06)",
                            border: `1px solid ${integration.connected ? "rgba(239,68,68,0.20)" : "rgba(255,255,255,0.10)"}`,
                            color: integration.connected ? "#f87171" : "rgba(255,255,255,0.50)",
                          }}
                          onClick={() => toast.info(integration.connected ? `Disconnected ${integration.name}` : `Connecting to ${integration.name}...`)}
                        >
                          {integration.connected ? "Disconnect" : <><span>Connect</span><ChevronRight className="w-3.5 h-3.5" /></>}
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
