import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Palette, LogOut, Upload, Moon, Sun, Sparkles, Lock, Trash2, AlertTriangle, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProfilePanelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onLogout?: () => Promise<void>;
}

export function ProfilePanel({ open, onOpenChange, onLogout }: ProfilePanelProps) {
    const { user, logout } = useAuth();
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [avatar, setAvatar] = useState<string>('');
    const [newPassword, setNewPassword] = useState('');
    const [deletePassword, setDeletePassword] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Load preferences from server
    useEffect(() => {
        if (user && open) {
            fetch('/api/users/preferences', {
                credentials: 'include'
            })
                .then(res => res.json())
                .then(data => {
                    if (data.avatar) setAvatar(data.avatar);
                    if (data.theme) {
                        setTheme(data.theme);
                        document.documentElement.classList.toggle('light-theme', data.theme === 'light');
                    }
                })
                .catch(() => {
                    // Fallback to localStorage
                    const savedAvatar = localStorage.getItem('userAvatar');
                    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' || 'dark';
                    if (savedAvatar) setAvatar(savedAvatar);
                    setTheme(savedTheme);
                });
        }
    }, [user, open]);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const avatarData = reader.result as string;
                setAvatar(avatarData);

                // Save to database
                try {
                    await fetch('/api/users/preferences', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ avatar: avatarData })
                    });
                    localStorage.setItem('userAvatar', avatarData);
                    setMessage({ type: 'success', text: 'Avatar updated!' });
                    setTimeout(() => setMessage(null), 3000);
                } catch (err) {
                    setMessage({ type: 'error', text: 'Failed to save avatar' });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleThemeChange = async (newTheme: 'dark' | 'light') => {
        setTheme(newTheme);
        document.documentElement.classList.toggle('light-theme', newTheme === 'light');

        // Save to database
        try {
            await fetch('/api/users/preferences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ theme: newTheme })
            });
            localStorage.setItem('theme', newTheme);
        } catch (err) {
            console.error('Failed to save theme');
        }
    };

    const handlePasswordChange = async () => {
        if (!newPassword || newPassword.length < 3) {
            setMessage({ type: 'error', text: 'Password must be at least 3 characters' });
            return;
        }

        try {
            const res = await fetch('/api/users/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ newPassword })
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: 'Password changed successfully!' });
                setNewPassword('');
                setTimeout(() => setMessage(null), 3000);
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to change password' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to change password' });
        }
    };

    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            setMessage({ type: 'error', text: 'Please enter your password' });
            return;
        }

        try {
            const res = await fetch('/api/users/delete-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ password: deletePassword })
            });

            const data = await res.json();

            if (res.ok) {
                // Account deleted, redirect to login
                window.location.reload();
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to delete account' });
                setShowDeleteConfirm(false);
                setDeletePassword('');
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to delete account' });
        }
    };

    const handleLogout = async () => {
        if (onLogout) {
            try {
                await onLogout();
            } catch (e) {
                console.error("Save before logout failed", e);
            }
        }
        logout();
    };

    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-gradient-to-b from-background via-qi-950/30 to-background border-qi-500/30 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-display bg-gradient-to-r from-qi-200 via-qi-400 to-qi-200 bg-clip-text text-transparent text-center">
                        Cultivator Profile
                    </DialogTitle>
                </DialogHeader>

                {message && (
                    <Alert className={message.type === 'success' ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'}>
                        <AlertDescription className={message.type === 'success' ? 'text-green-400' : 'text-red-400'}>
                            {message.text}
                        </AlertDescription>
                    </Alert>
                )}

                <Tabs defaultValue="profile" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-muted/30 border border-qi-500/20">
                        <TabsTrigger
                            value="profile"
                            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-qi-600 data-[state=active]:to-qi-500 data-[state=active]:text-white"
                        >
                            <User className="w-4 h-4 mr-2" />
                            Profile
                        </TabsTrigger>
                        <TabsTrigger
                            value="settings"
                            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-qi-600 data-[state=active]:to-qi-500 data-[state=active]:text-white"
                        >
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile" className="space-y-6 pt-4">
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-qi-600 to-qi-500 p-1 shadow-lg shadow-qi-500/50">
                                    <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                                        {avatar ? (
                                            <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-12 h-12 text-qi-400" />
                                        )}
                                    </div>
                                </div>
                                <label className="absolute bottom-0 right-0 p-2 bg-qi-600 rounded-full cursor-pointer hover:bg-qi-500 transition-colors shadow-lg">
                                    <Upload className="w-4 h-4 text-white" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarUpload}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            <div className="text-center">
                                <h3 className="text-xl font-display text-qi-300">{user.username}</h3>
                                <p className="text-sm text-muted-foreground">Cultivator ID: #{user.id}</p>
                            </div>
                        </div>

                        {/* Logout Button */}
                        <Button
                            onClick={handleLogout}
                            variant="destructive"
                            className="w-full"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Save & Logout
                        </Button>
                    </TabsContent>

                    <TabsContent value="settings" className="space-y-6 pt-4">
                        <div className="space-y-4">
                            <Label className="text-qi-300 font-display flex items-center gap-2">
                                <Palette className="w-4 h-4" />
                                Theme
                            </Label>

                            {/* Dark Theme */}
                            <Card
                                onClick={() => handleThemeChange('dark')}
                                className={`p-4 cursor-pointer transition-all duration-300 ${theme === 'dark'
                                    ? 'border-2 border-qi-500 bg-gradient-to-br from-qi-900/40 to-qi-800/20 shadow-lg shadow-qi-500/30'
                                    : 'border border-muted/30 hover:border-qi-500/50'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-lg bg-gradient-to-br from-qi-900 to-qi-800 border border-qi-500/30">
                                        <Moon className="w-6 h-6 text-qi-300" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-display text-lg text-qi-300">Dark Cultivation</h4>
                                        <p className="text-xs text-muted-foreground">Mystical purple energy theme</p>
                                    </div>
                                    {theme === 'dark' && (
                                        <Sparkles className="w-5 h-5 text-qi-400 animate-pulse" />
                                    )}
                                </div>
                            </Card>

                            {/* Light Theme */}
                            <Card
                                onClick={() => handleThemeChange('light')}
                                className={`p-4 cursor-pointer transition-all duration-300 ${theme === 'light'
                                    ? 'border-2 border-amber-500 bg-gradient-to-br from-amber-100/40 to-amber-50/20 shadow-lg shadow-amber-500/30'
                                    : 'border border-muted/30 hover:border-amber-500/50'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-lg bg-gradient-to-br from-amber-100 to-amber-200 border border-amber-500/30">
                                        <Sun className="w-6 h-6 text-amber-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-display text-lg text-amber-700">Light Ascension</h4>
                                        <p className="text-xs text-amber-600/70">Radiant golden energy theme</p>
                                    </div>
                                    {theme === 'light' && (
                                        <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                                    )}
                                </div>
                            </Card>
                        </div>

                        {/* Change Password */}
                        <div className="space-y-3 pt-4 border-t border-qi-500/20">
                            <Label className="text-qi-300 font-display flex items-center gap-2">
                                <Lock className="w-4 h-4" />
                                Security
                            </Label>
                            <div className="space-y-2">
                                <Input
                                    type="password"
                                    placeholder="New Password (min 3 chars)"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="bg-muted/30 border-qi-500/20"
                                />
                                <Button
                                    onClick={handlePasswordChange}
                                    className="w-full bg-gradient-to-r from-qi-600 to-qi-500 hover:from-qi-500 hover:to-qi-400"
                                >
                                    Update Password
                                </Button>
                            </div>
                        </div>

                        {/* Delete Account */}
                        <div className="space-y-3 pt-4 border-t border-destructive/20">
                            <Label className="text-destructive font-display flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Danger Zone
                            </Label>

                            {!showDeleteConfirm ? (
                                <Button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    variant="destructive"
                                    className="w-full"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Account
                                </Button>
                            ) : (
                                <div className="space-y-3 p-4 border-2 border-destructive/50 rounded-lg bg-destructive/10">
                                    <Input
                                        type="password"
                                        placeholder="Confirm with Password"
                                        value={deletePassword}
                                        onChange={(e) => setDeletePassword(e.target.value)}
                                        className="bg-background border-destructive/50"
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => {
                                                setShowDeleteConfirm(false);
                                                setDeletePassword('');
                                            }}
                                            variant="outline"
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleDeleteAccount}
                                            variant="destructive"
                                            className="flex-1"
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
