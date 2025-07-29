
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, AlertTriangle, ExternalLink, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function AdminSetup() {
  const [adminCreated, setAdminCreated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('admin@schoolmaster.com');
  const [password, setPassword] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  // Generate a secure random password
  const generateSecurePassword = () => {
    const length = 16;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const createAdminUser = async () => {
    if (!email.trim() || !password.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both email and password.",
        variant: "destructive",
      });
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: 'Admin',
            last_name: 'User',
            role: 'admin'
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered') || error.message.includes('User already registered')) {
          setAdminCreated(true);
          toast({
            title: "Admin Already Exists",
            description: "Admin user already exists. Use the login page to sign in.",
          });
        } else {
          console.error('Error creating admin:', error);
          toast({
            title: "Error Creating Admin",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        setAdminCreated(true);
        setShowPassword(true);
        toast({
          title: "Admin Created Successfully",
          description: "Admin user has been created. Save the credentials securely.",
        });
      }
    } catch (error: any) {
      console.error('Error in createAdminUser:', error);
      toast({
        title: "Error",
        description: "Failed to create admin user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePassword = () => {
    const newPassword = generateSecurePassword();
    setPassword(newPassword);
    setGeneratedPassword(newPassword);
    toast({
      title: "Password Generated",
      description: "Secure password generated. Make sure to save it securely.",
    });
  };

  const copyCredentials = () => {
    if (!email || !password) return;
    const credentialsText = `Email: ${email}\nPassword: ${password}\nIMPORTANT: Save these credentials securely`;
    navigator.clipboard.writeText(credentialsText);
    
    toast({
      title: "Credentials Copied",
      description: "Admin credentials copied to clipboard.",
    });
  };

  return (
    <div className="space-y-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center">Admin Setup</CardTitle>
          <CardDescription className="text-center">
            Set up your admin account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Admin Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@schoolmaster.com"
                disabled={loading || adminCreated}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-password">Admin Password</Label>
              <div className="flex gap-2">
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter a secure password"
                  disabled={loading || adminCreated}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGeneratePassword}
                  disabled={loading || adminCreated}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-600">
                Password must be at least 8 characters. Use the generate button for a secure password.
              </p>
            </div>

            {generatedPassword && (
              <Alert>
                <AlertDescription>
                  <p className="font-medium mb-2">Generated Password:</p>
                  <div className="bg-gray-100 p-2 rounded text-sm font-mono break-all">
                    {generatedPassword}
                  </div>
                  <p className="text-xs text-orange-600 mt-1">⚠️ Save this password securely before creating the admin</p>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={copyCredentials}
              variant="outline"
              className="flex-1"
              disabled={loading || !email || !password}
            >
              Copy Credentials
            </Button>
            <Button 
              onClick={createAdminUser}
              className="flex-1"
              disabled={loading || adminCreated || !email || !password}
            >
              {loading ? "Creating..." : adminCreated ? "Admin Created ✓" : "Create Admin"}
            </Button>
          </div>

          {adminCreated && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Admin Account Created!</p>
                  <p className="text-sm">
                    You can now try logging in with the admin credentials. If you get an email confirmation error, please follow the instructions below.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Email Confirmation Issue</p>
                <p className="text-sm">
                  If login fails due to email confirmation, disable email confirmation in Supabase:
                </p>
                <div className="text-sm space-y-1">
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Go to your Supabase Dashboard</li>
                    <li>Navigate to Authentication → Settings</li>
                    <li>Turn OFF "Enable email confirmations"</li>
                    <li>Save changes and try logging in again</li>
                  </ol>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => window.open('https://supabase.com/dashboard/project/ifurbtuwhlshufowjcyc/auth/providers', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Supabase Auth Settings
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
