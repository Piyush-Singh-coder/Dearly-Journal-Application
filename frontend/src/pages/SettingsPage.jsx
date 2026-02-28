import React, { useRef, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { uploadFile } from "../lib/upload";
import {
  User,
  Palette,
  Bell,
  Settings as SettingsIcon,
  LogOut,
  Save,
  Trash2,
  AlertTriangle,
  Moon,
  Sun,
  Monitor,
  Camera,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const {
    user,
    updateProfile,
    updateSettings,
    changePassword,
    deleteAccount,
    logout,
  } = useAuthStore();
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);

  // Profile State
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);

  // Appearance State
  const [theme, setTheme] = useState(user?.settings?.theme || "system");

  // Sync local theme state if it changes globally (e.g., from DashboardLayout toggle)
  React.useEffect(() => {
    setTheme(user?.settings?.theme || "system");
  }, [user?.settings?.theme]);

  // Account State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Notifications State
  const [enableDailyReminder, setEnableDailyReminder] = useState(
    !!user?.settings?.dailyReminder,
  );
  // Extract time string "HH:mm" from UTC date if exists
  const getInitialTime = () => {
    if (!user?.settings?.dailyReminder) return "09:00";
    const date = new Date(user.settings.dailyReminder);
    return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  };
  const [reminderTime, setReminderTime] = useState(getInitialTime());

  // Handle Avatar File Upload
  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return toast.error("Please select an image file.");
    if (file.size > 5 * 1024 * 1024)
      return toast.error("Image must be smaller than 5MB.");

    setIsUploadingAvatar(true);
    try {
      const publicUrl = await uploadFile(file, "avatars");
      setAvatarUrl(publicUrl);
      toast.success("Photo uploaded! Click Save Profile to apply.");
    } catch (err) {
      console.error("Avatar upload error:", err);
      toast.error(err.message || "Upload failed.");
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = "";
    }
  };

  // Handle Profile Save
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateProfile({ fullName, avatarUrl });
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Theme Change immediately

  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme);
    // Apply theme to document
    if (
      newTheme === "dark" ||
      (newTheme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    try {
      await updateSettings({ theme: newTheme });
    } catch {
      toast.error("Failed to save theme setting");
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      return toast.error("New password must be at least 8 characters");
    }
    setIsLoading(true);
    try {
      await changePassword({ currentPassword, newPassword });
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Account Deletion
  const handleDeleteAccount = async () => {
    setIsLoading(true);
    try {
      await deleteAccount();
      // AuthStore deleteAccount also removes token and resets state
      toast.success("Account deleted successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete account");
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  // Handle Settings Save (Notifications)
  const handleSaveNotifications = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let dailyReminderDate = null;
      if (enableDailyReminder) {
        // Create an arbitrary date with the selected time
        const [hours, minutes] = reminderTime.split(":");
        const date = new Date();
        date.setHours(parseInt(hours, 10));
        date.setMinutes(parseInt(minutes, 10));
        date.setSeconds(0);
        date.setMilliseconds(0);
        dailyReminderDate = date.toISOString();
      }

      await updateSettings({ dailyReminder: dailyReminderDate });
      toast.success("Notification settings updated");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to update notification settings",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "account", label: "Account", icon: SettingsIcon },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8 min-h-[calc(100vh-120px)]">
      {/* Sidebar */}
      <aside className="w-full md:w-64 shrink-0 flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 px-4">
          Settings
        </h2>
        <nav className="flex md:flex-col overflow-x-auto md:overflow-visible gap-2 pb-2 hide-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors shrink-0 md:w-full text-left font-medium ${
                  isActive
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}

          <div className="hidden md:block h-px bg-slate-200 dark:bg-slate-800 my-4 mx-4"></div>

          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors shrink-0 md:w-full text-left font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
          >
            <LogOut className="w-5 h-5" />
            <span>Log out</span>
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 bg-white dark:bg-surface-dark rounded-3xl p-6 md:p-10 shadow-sm border border-slate-100 dark:border-slate-800">
        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="animate-fade-in">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              Profile Settings
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-6 max-w-xl">
              {/* Avatar Picker */}
              <div className="flex items-center gap-6 mb-8">
                <div className="relative group shrink-0">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-50 dark:border-slate-800 bg-slate-100">
                    <img
                      src={
                        avatarUrl ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || user?.email || "User")}&background=random`
                      }
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || user?.email || "User")}&background=random`;
                      }}
                    />
                  </div>
                  {/* Upload overlay button */}
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                      <Camera className="w-6 h-6 text-white" />
                    )}
                  </button>
                  {/* Hidden file input */}
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarFileChange}
                  />
                </div>

                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    Profile Photo
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {isUploadingAvatar
                      ? "Uploading..."
                      : "Hover the photo and click the camera icon to upload."}
                  </p>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="mt-3 text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4" />
                    {isUploadingAvatar ? "Uploading..." : "Choose photo"}
                  </button>
                  <p className="text-xs text-slate-400 mt-1">
                    JPG, PNG, GIF or WEBP — max 5MB
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-surface-container-dark text-slate-500 dark:text-slate-400 cursor-not-allowed opacity-70"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Email address cannot be changed.
                </p>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isLoading ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Appearance Tab */}
        {activeTab === "appearance" && (
          <div className="animate-fade-in">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              Appearance
            </h3>

            <div className="space-y-6 max-w-xl">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
                  Theme Preference
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button
                    onClick={() => handleThemeChange("light")}
                    className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${
                      theme === "light"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                  >
                    <Sun className="w-8 h-8 mb-3" />
                    <span className="font-medium">Light</span>
                  </button>

                  <button
                    onClick={() => handleThemeChange("dark")}
                    className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${
                      theme === "dark"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                  >
                    <Moon className="w-8 h-8 mb-3" />
                    <span className="font-medium">Dark</span>
                  </button>

                  <button
                    onClick={() => handleThemeChange("system")}
                    className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${
                      theme === "system"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                  >
                    <Monitor className="w-8 h-8 mb-3" />
                    <span className="font-medium">System</span>
                  </button>
                </div>
                <p className="text-sm text-slate-500 mt-4">
                  System setting will automatically match your device's active
                  theme.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Account Tab */}
        {activeTab === "account" && (
          <div className="animate-fade-in">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              Account Settings
            </h3>

            {user?.googleId ? (
              <div className="bg-slate-50 dark:bg-surface-container-dark p-6 rounded-2xl border border-slate-100 dark:border-slate-800 mb-10 max-w-xl">
                <h4 className="font-medium text-slate-900 dark:text-white mb-2">
                  Connected via Google
                </h4>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  You sign in using your Google account. Password changes are
                  managed through Google.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleChangePassword}
                className="space-y-6 max-w-xl mb-12"
              >
                <h4 className="font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                  Change Password
                </h4>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isLoading || !currentPassword || !newPassword}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white rounded-xl font-medium transition-all disabled:opacity-50"
                  >
                    {isLoading ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            )}

            <div className="max-w-xl">
              <h4 className="font-semibold text-red-600 dark:text-red-400 border-b border-red-100 dark:border-red-900/30 pb-2 mb-6">
                Danger Zone
              </h4>

              {!showDeleteConfirm ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-500/5">
                  <div>
                    <h5 className="font-medium text-red-800 dark:text-red-400">
                      Delete Account
                    </h5>
                    <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1">
                      Permanently remove your account and all data. This cannot
                      be undone.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="shrink-0 px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 rounded-lg font-medium transition-colors"
                  >
                    Delete Account
                  </button>
                </div>
              ) : (
                <div className="p-6 rounded-2xl border-2 border-red-500 bg-red-50 dark:bg-red-500/10">
                  <div className="flex items-start gap-3 mb-6">
                    <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-red-800 dark:text-red-400 text-lg">
                        Are you absolutely sure?
                      </h5>
                      <p className="text-red-700 dark:text-red-300 mt-2 text-sm">
                        This action <strong>cannot be undone</strong>. This will
                        permanently delete your account, all your journals,
                        entries, and remove your access to team journals.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isLoading}
                      className="px-5 py-2.5 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={isLoading}
                      className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      {isLoading ? "Deleting..." : "Yes, delete my account"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div className="animate-fade-in">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              Notifications
            </h3>

            <form
              onSubmit={handleSaveNotifications}
              className="space-y-8 max-w-xl"
            >
              <div className="flex items-start justify-between gap-4 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white">
                    Daily Journal Reminder
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Receive an email reminding you to write your entry for the
                    day.
                  </p>
                </div>

                {/* Custom Toggle Switch */}
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={enableDailyReminder}
                    onChange={(e) => setEnableDailyReminder(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary"></div>
                </label>
              </div>

              {enableDailyReminder && (
                <div className="animate-fade-in pl-2 border-l-2 border-primary/20">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Reminder Time (Local Time)
                  </label>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    required
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isLoading ? "Saving..." : "Save Preferences"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
