import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  User, Bell, Shield, Globe, Palette, Link2, Trash2, Save,
  Camera, Check, ChevronRight, Mail, Phone, MapPin, Building2,
  Eye, EyeOff, Smartphone, Monitor, Moon, Sun
} from "lucide-react";

type SettingsTab = "profile" | "notifications" | "security" | "preferences" | "integrations";

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
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

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [notifications, setNotifications] = useState(
    NOTIFICATION_SETTINGS.reduce((acc, n) => ({
      ...acc,
      [n.id]: { email: n.email, push: n.push, sms: n.sms }
    }), {} as Record<string, { email: boolean; push: boolean; sms: boolean }>)
  );

  const [profile, setProfile] = useState({
    name: user?.name || "Magic Yang",
    email: user?.email || "magic@example.com",
    phone: "+1 (555) 123-4567",
    company: "TechBuy Inc.",
    location: "San Francisco, CA",
    bio: "Sourcing professional with 5+ years of experience in consumer electronics.",
    language: "English",
    timezone: "America/Los_Angeles",
  });

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsSaving(false);
    toast.success("Settings saved successfully!");
  };

  const toggleNotification = (id: string, channel: "email" | "push" | "sms") => {
    setNotifications((prev) => ({
      ...prev,
      [id]: { ...prev[id], [channel]: !prev[id][channel] }
    }));
  };

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={cn(
        "w-10 h-6 rounded-full transition-all duration-200 relative flex-shrink-0",
        checked ? "bg-purple-600" : "bg-white/20"
      )}
    >
      <div className={cn(
        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-200 shadow-sm",
        checked ? "left-5" : "left-1"
      )} />
    </button>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-6">
        {/* 头部 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your account preferences and configurations</p>
        </div>

        <div className="flex gap-6">
          {/* 侧边导航 */}
          <div className="w-52 flex-shrink-0">
            <div className="bg-card/50 border border-white/10 rounded-2xl p-2 space-y-1">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                    activeTab === tab.id
                      ? "bg-purple-600/20 text-purple-300"
                      : "text-muted-foreground hover:text-white hover:bg-white/5"
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* 内容区 */}
          <div className="flex-1 bg-card/50 border border-white/10 rounded-2xl p-6">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <h2 className="font-bold text-lg">Profile Information</h2>

                {/* 头像 */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-400 rounded-2xl flex items-center justify-center text-2xl font-bold text-white">
                      {profile.name.slice(0, 2).toUpperCase()}
                    </div>
                    <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-purple-600 hover:bg-purple-500 rounded-full flex items-center justify-center transition-all shadow-lg">
                      <Camera className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                  <div>
                    <p className="font-semibold">{profile.name}</p>
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                    <button className="text-xs text-purple-400 hover:text-purple-300 mt-1 transition-colors">
                      Change avatar
                    </button>
                  </div>
                </div>

                {/* 表单 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className="pl-9 bg-white/5 border-white/10 focus:border-purple-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        className="pl-9 bg-white/5 border-white/10 focus:border-purple-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        className="pl-9 bg-white/5 border-white/10 focus:border-purple-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Company</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={profile.company}
                        onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                        className="pl-9 bg-white/5 border-white/10 focus:border-purple-500"
                      />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={profile.location}
                        onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                        className="pl-9 bg-white/5 border-white/10 focus:border-purple-500"
                      />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Bio</label>
                    <textarea
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white resize-none focus:outline-none focus:border-purple-500 placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={isSaving} className="bg-purple-600 hover:bg-purple-500 gap-2">
                    {isSaving ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
                    ) : (
                      <><Save className="w-4 h-4" />Save Changes</>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <h2 className="font-bold text-lg">Notification Preferences</h2>
                <div className="overflow-hidden rounded-xl border border-white/10">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5">
                        <th className="text-left px-4 py-3 text-sm font-semibold text-muted-foreground">Notification</th>
                        <th className="text-center px-4 py-3 text-sm font-semibold text-muted-foreground">
                          <div className="flex items-center justify-center gap-1.5"><Mail className="w-3.5 h-3.5" />Email</div>
                        </th>
                        <th className="text-center px-4 py-3 text-sm font-semibold text-muted-foreground">
                          <div className="flex items-center justify-center gap-1.5"><Smartphone className="w-3.5 h-3.5" />Push</div>
                        </th>
                        <th className="text-center px-4 py-3 text-sm font-semibold text-muted-foreground">
                          <div className="flex items-center justify-center gap-1.5"><Phone className="w-3.5 h-3.5" />SMS</div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {NOTIFICATION_SETTINGS.map((n, i) => (
                        <tr key={n.id} className={cn("border-b border-white/5", i % 2 === 0 ? "" : "bg-white/2")}>
                          <td className="px-4 py-4">
                            <div className="font-medium text-sm text-white">{n.label}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{n.desc}</div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex justify-center">
                              <Toggle checked={notifications[n.id]?.email} onChange={() => toggleNotification(n.id, "email")} />
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex justify-center">
                              <Toggle checked={notifications[n.id]?.push} onChange={() => toggleNotification(n.id, "push")} />
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex justify-center">
                              <Toggle checked={notifications[n.id]?.sms} onChange={() => toggleNotification(n.id, "sms")} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={isSaving} className="bg-purple-600 hover:bg-purple-500 gap-2">
                    <Save className="w-4 h-4" />Save Preferences
                  </Button>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <h2 className="font-bold text-lg">Security Settings</h2>

                {/* 修改密码 */}
                <div className="bg-white/5 rounded-xl p-5 border border-white/10 space-y-4">
                  <h3 className="font-semibold">Change Password</h3>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Current Password</label>
                    <div className="relative">
                      <Input
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder="Enter current password"
                        className="pr-10 bg-white/5 border-white/10 focus:border-purple-500"
                      />
                      <button
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">New Password</label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        className="pr-10 bg-white/5 border-white/10 focus:border-purple-500"
                      />
                      <button
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button onClick={() => toast.success("Password updated!")} className="bg-purple-600 hover:bg-purple-500 gap-2">
                    <Shield className="w-4 h-4" />Update Password
                  </Button>
                </div>

                {/* 两步验证 */}
                <div className="bg-white/5 rounded-xl p-5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Two-Factor Authentication</h3>
                      <p className="text-sm text-muted-foreground mt-1">Add an extra layer of security to your account</p>
                    </div>
                    <Button variant="outline" className="border-white/20 hover:bg-white/10">
                      Enable 2FA
                    </Button>
                  </div>
                </div>

                {/* 危险区域 */}
                <div className="bg-red-900/10 rounded-xl p-5 border border-red-500/20">
                  <h3 className="font-semibold text-red-400 mb-2">Danger Zone</h3>
                  <p className="text-sm text-muted-foreground mb-4">Permanently delete your account and all associated data.</p>
                  <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10 gap-2">
                    <Trash2 className="w-4 h-4" />Delete Account
                  </Button>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === "preferences" && (
              <div className="space-y-6">
                <h2 className="font-bold text-lg">Display Preferences</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                    <div>
                      <p className="font-medium">Language</p>
                      <p className="text-sm text-muted-foreground">Interface language</p>
                    </div>
                    <select className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500">
                      <option>English</option>
                      <option>中文</option>
                      <option>日本語</option>
                      <option>한국어</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                    <div>
                      <p className="font-medium">Timezone</p>
                      <p className="text-sm text-muted-foreground">Used for webinar times and meeting scheduling</p>
                    </div>
                    <select className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500">
                      <option>America/Los_Angeles (UTC-8)</option>
                      <option>America/New_York (UTC-5)</option>
                      <option>Europe/London (UTC+0)</option>
                      <option>Asia/Shanghai (UTC+8)</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                    <div>
                      <p className="font-medium">Currency</p>
                      <p className="text-sm text-muted-foreground">Display prices in your preferred currency</p>
                    </div>
                    <select className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500">
                      <option>USD ($)</option>
                      <option>EUR (€)</option>
                      <option>GBP (£)</option>
                      <option>CNY (¥)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Integrations Tab */}
            {activeTab === "integrations" && (
              <div className="space-y-6">
                <h2 className="font-bold text-lg">Integrations</h2>
                <div className="space-y-3">
                  {INTEGRATIONS.map((integration) => (
                    <div key={integration.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-2xl">
                          {integration.icon}
                        </div>
                        <div>
                          <p className="font-semibold">{integration.name}</p>
                          <p className="text-sm text-muted-foreground">{integration.desc}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {integration.connected && (
                          <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full">
                            <Check className="w-3 h-3" />Connected
                          </span>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "border-white/20 gap-1.5",
                            integration.connected ? "hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30" : "hover:bg-white/10"
                          )}
                          onClick={() => toast.info(integration.connected ? `Disconnected ${integration.name}` : `Connecting to ${integration.name}...`)}
                        >
                          {integration.connected ? "Disconnect" : <>Connect <ChevronRight className="w-3.5 h-3.5" /></>}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
