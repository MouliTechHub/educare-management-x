
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, CheckCircle, AlertTriangle, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function AdminSetup() {
  const [adminCreated, setAdminCreated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const createAdminUser = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: 'admin@schoolmaster.com',
        password: 'TempPassword123!', // User should change this immediately
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
        toast({
          title: "Admin Created Successfully",
          description: "Admin user has been created. Use temp password: TempPassword123! (Change this immediately after login)",
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

  const copyCredentials = () => {
    const credentialsText = `Email: admin@schoolmaster.com\nPassword: TempPassword123!\nIMPORTANT: Change this password immediately after first login`;
    navigator.clipboard.writeText(credentialsText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    toast({
      title: "Credentials Copied",
      description: "Admin credentials copied. Please change the password after first login.",
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
          <Alert>
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Default Admin Credentials:</p>
                <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                  <div>Email: admin@schoolmaster.com</div>
                  <div>Password: TempPassword123!</div>
                  <div className="text-orange-600 font-medium mt-1">⚠️ Change after first login</div>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button 
              onClick={copyCredentials}
              variant="outline"
              className="flex-1"
              disabled={loading}
            >
              {copied ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "Copied!" : "Copy Credentials"}
            </Button>
          </div>

          <Button 
            onClick={createAdminUser}
            className="w-full"
            disabled={loading || adminCreated}
          >
            {loading ? "Creating..." : adminCreated ? "Admin Created ✓" : "Create Admin User"}
          </Button>

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
