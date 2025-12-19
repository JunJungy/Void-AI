import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Player } from "@/components/Player";
import { useAuth } from "@/lib/authContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Users, Ticket, Plus, Trash2, ToggleLeft, ToggleRight, Loader2, Crown, Gem, Diamond, Search, Copy, Check, Ban, Shield, ShieldOff, AlertTriangle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface AdminUser {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  planType: string;
  planExpiresAt: string | null;
  credits: number;
  isOwner: boolean;
  isBanned: boolean;
  createdAt: string;
}

interface PromoCode {
  id: string;
  code: string;
  planType: string;
  durationDays: number;
  maxUses: number;
  currentUses: number;
  bonusCredits: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

const PLAN_ICONS: Record<string, any> = {
  pro: Crown,
  ruby: Gem,
  diamond: Diamond,
};

const PLAN_COLORS: Record<string, string> = {
  free: "bg-gray-500/20 text-gray-400",
  pro: "bg-purple-500/20 text-purple-400",
  ruby: "bg-red-500/20 text-red-400",
  diamond: "bg-cyan-500/20 text-cyan-400",
};

export default function Admin() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateCodeOpen, setIsCreateCodeOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  const [newCode, setNewCode] = useState({
    code: "",
    planType: "pro",
    durationDays: 30,
    maxUses: 1,
    bonusCredits: 0,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    } else if (!authLoading && user && !user.isOwner) {
      setLocation("/");
    }
  }, [authLoading, isAuthenticated, user, setLocation]);

  const { data: users = [], isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/users");
      return res.json();
    },
    enabled: !!user?.isOwner,
  });

  const { data: promoCodes = [], isLoading: codesLoading } = useQuery<PromoCode[]>({
    queryKey: ["/api/admin/promo-codes"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/promo-codes");
      return res.json();
    },
    enabled: !!user?.isOwner,
  });

  const updateUserPlan = useMutation({
    mutationFn: async ({ userId, planType, durationDays, credits }: { userId: string; planType: string; durationDays?: number; credits?: number }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/plan`, { planType, durationDays, credits });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User plan updated" });
    },
    onError: () => {
      toast({ title: "Failed to update user", variant: "destructive" });
    },
  });

  const createPromoCode = useMutation({
    mutationFn: async (data: typeof newCode) => {
      const res = await apiRequest("POST", "/api/admin/promo-codes", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
      toast({ title: "Promo code created" });
      setIsCreateCodeOpen(false);
      setNewCode({ code: "", planType: "pro", durationDays: 30, maxUses: 1, bonusCredits: 0 });
    },
    onError: (error: any) => {
      toast({ title: error.message || "Failed to create code", variant: "destructive" });
    },
  });

  const togglePromoCode = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/promo-codes/${id}`, { isActive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
      toast({ title: "Promo code updated" });
    },
  });

  const deletePromoCode = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/promo-codes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
      toast({ title: "Promo code deleted" });
    },
  });

  const banUser = useMutation({
    mutationFn: async ({ userId, isBanned }: { userId: string; isBanned: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/ban`, { isBanned });
      return res.json();
    },
    onSuccess: (_, { isBanned }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: isBanned ? "User banned" : "User unbanned" });
    },
    onError: () => {
      toast({ title: "Failed to update ban status", variant: "destructive" });
    },
  });

  const toggleUserAdmin = useMutation({
    mutationFn: async ({ userId, isOwner }: { userId: string; isOwner: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/owner`, { isOwner });
      return res.json();
    },
    onSuccess: (_, { isOwner }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: isOwner ? "User is now an admin" : "Admin privileges removed" });
    },
    onError: () => {
      toast({ title: "Failed to update admin status", variant: "destructive" });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete user", variant: "destructive" });
    },
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "VOID-";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCode({ ...newCode, code });
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || !user?.isOwner) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-auto pb-24 lg:ml-64">
        <div className="p-6 max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
            <p className="text-muted-foreground">Manage users and promo codes</p>
          </div>

          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="bg-white/5">
              <TabsTrigger value="users" className="gap-2" data-testid="tab-users">
                <Users className="w-4 h-4" />
                Users ({users.length})
              </TabsTrigger>
              <TabsTrigger value="codes" className="gap-2" data-testid="tab-codes">
                <Ticket className="w-4 h-4" />
                Promo Codes ({promoCodes.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10"
                    data-testid="input-search-users"
                  />
                </div>
              </div>

              {usersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredUsers.map((u) => (
                    <Card key={u.id} className="bg-white/5 border-white/10" data-testid={`card-user-${u.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-white">{u.displayName || u.username}</span>
                                {u.isOwner && <Badge variant="outline" className="text-xs border-purple-500 text-purple-400">Owner</Badge>}
                                {u.isBanned && <Badge variant="destructive" className="text-xs">Banned</Badge>}
                              </div>
                              <p className="text-sm text-muted-foreground">{u.email}</p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span>Credits: {u.credits}</span>
                                {u.planExpiresAt && (
                                  <span>Expires: {format(new Date(u.planExpiresAt), "MMM d, yyyy")}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Badge className={PLAN_COLORS[u.planType] || PLAN_COLORS.free}>
                              {u.planType}
                            </Badge>
                            
                            <Select
                              value={u.planType}
                              onValueChange={(value) => updateUserPlan.mutate({ userId: u.id, planType: value, durationDays: 30 })}
                            >
                              <SelectTrigger className="w-32 bg-white/5 border-white/10" data-testid={`select-plan-${u.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="free">Free</SelectItem>
                                <SelectItem value="pro">Pro</SelectItem>
                                <SelectItem value="ruby">Ruby</SelectItem>
                                <SelectItem value="diamond">Diamond</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-white/5 border-white/10"
                              onClick={() => updateUserPlan.mutate({ userId: u.id, planType: u.planType, credits: 50 })}
                              data-testid={`button-add-credits-${u.id}`}
                            >
                              +50 Credits
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              className={u.isBanned ? "bg-green-500/20 border-green-500/50 text-green-400 hover:bg-green-500/30" : "bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30"}
                              onClick={() => banUser.mutate({ userId: u.id, isBanned: !u.isBanned })}
                              disabled={u.id === user?.id}
                              data-testid={`button-ban-${u.id}`}
                            >
                              <Ban className="w-4 h-4 mr-1" />
                              {u.isBanned ? "Unban" : "Ban"}
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              className={u.isOwner ? "bg-orange-500/20 border-orange-500/50 text-orange-400 hover:bg-orange-500/30" : "bg-purple-500/20 border-purple-500/50 text-purple-400 hover:bg-purple-500/30"}
                              onClick={() => toggleUserAdmin.mutate({ userId: u.id, isOwner: !u.isOwner })}
                              disabled={u.id === user?.id}
                              data-testid={`button-admin-${u.id}`}
                            >
                              {u.isOwner ? <ShieldOff className="w-4 h-4 mr-1" /> : <Shield className="w-4 h-4 mr-1" />}
                              {u.isOwner ? "Remove Admin" : "Make Admin"}
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30"
                                  disabled={u.id === user?.id}
                                  data-testid={`button-delete-${u.id}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-background border-white/10">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-red-500" />
                                    Delete User
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete <strong>{u.displayName || u.username}</strong>? This will permanently remove their account and all their data including tracks and videos.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-white/5 border-white/10">Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={() => deleteUser.mutate(u.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="codes" className="space-y-4">
              <div className="flex justify-end">
                <Dialog open={isCreateCodeOpen} onOpenChange={setIsCreateCodeOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 bg-purple-600 hover:bg-purple-700" data-testid="button-create-code">
                      <Plus className="w-4 h-4" />
                      Create Code
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-background border-white/10">
                    <DialogHeader>
                      <DialogTitle>Create Promo Code</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Code</Label>
                        <div className="flex gap-2">
                          <Input
                            value={newCode.code}
                            onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
                            placeholder="VOID-XXXXX"
                            className="bg-white/5 border-white/10"
                            data-testid="input-code"
                          />
                          <Button variant="outline" onClick={generateRandomCode} className="bg-white/5 border-white/10">
                            Generate
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Plan Type</Label>
                        <Select value={newCode.planType} onValueChange={(v) => setNewCode({ ...newCode, planType: v })}>
                          <SelectTrigger className="bg-white/5 border-white/10" data-testid="select-plan-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pro">Pro</SelectItem>
                            <SelectItem value="ruby">Ruby</SelectItem>
                            <SelectItem value="diamond">Diamond</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Duration (days)</Label>
                          <Input
                            type="number"
                            value={newCode.durationDays}
                            onChange={(e) => setNewCode({ ...newCode, durationDays: parseInt(e.target.value) || 30 })}
                            className="bg-white/5 border-white/10"
                            data-testid="input-duration"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Max Uses</Label>
                          <Input
                            type="number"
                            value={newCode.maxUses}
                            onChange={(e) => setNewCode({ ...newCode, maxUses: parseInt(e.target.value) || 1 })}
                            className="bg-white/5 border-white/10"
                            data-testid="input-max-uses"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Bonus Credits</Label>
                        <Input
                          type="number"
                          value={newCode.bonusCredits}
                          onChange={(e) => setNewCode({ ...newCode, bonusCredits: parseInt(e.target.value) || 0 })}
                          className="bg-white/5 border-white/10"
                          data-testid="input-bonus-credits"
                        />
                      </div>
                      
                      <Button
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        onClick={() => createPromoCode.mutate(newCode)}
                        disabled={!newCode.code || createPromoCode.isPending}
                        data-testid="button-submit-code"
                      >
                        {createPromoCode.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Code"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {codesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                </div>
              ) : promoCodes.length === 0 ? (
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="p-8 text-center">
                    <Ticket className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No promo codes yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Create your first code to give users free plans</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {promoCodes.map((code) => (
                    <Card key={code.id} className="bg-white/5 border-white/10" data-testid={`card-code-${code.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <code className="text-lg font-mono text-white bg-white/10 px-3 py-1 rounded">
                                {code.code}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => copyCode(code.code)}
                                className="h-8 w-8"
                              >
                                {copiedCode === code.code ? (
                                  <Check className="w-4 h-4 text-green-400" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge className={PLAN_COLORS[code.planType]}>
                                  {code.planType}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {code.durationDays} days
                                </span>
                                {code.bonusCredits > 0 && (
                                  <span className="text-sm text-green-400">
                                    +{code.bonusCredits} credits
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Uses: {code.currentUses}/{code.maxUses} • Created: {format(new Date(code.createdAt), "MMM d, yyyy")}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge variant={code.isActive ? "default" : "secondary"} className={code.isActive ? "bg-green-500/20 text-green-400" : ""}>
                              {code.isActive ? "Active" : "Inactive"}
                            </Badge>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => togglePromoCode.mutate({ id: code.id, isActive: !code.isActive })}
                              data-testid={`button-toggle-${code.id}`}
                            >
                              {code.isActive ? (
                                <ToggleRight className="w-5 h-5 text-green-400" />
                              ) : (
                                <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                              )}
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deletePromoCode.mutate(code.id)}
                              className="text-red-400 hover:text-red-300"
                              data-testid={`button-delete-${code.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Player />
    </div>
  );
}
