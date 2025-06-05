
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GraduationCap, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LoginPageProps {
  onLogin: (user: {
    id: string;
    username: string;
    role: "Admin" | "Teacher" | "Parent" | "Accountant";
  }) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  // Demo credentials for testing
  const demoCredentials = [
    { username: "admin", password: "admin123", role: "Admin" as const },
    { username: "teacher1", password: "teacher123", role: "Teacher" as const },
    { username: "parent1", password: "parent123", role: "Parent" as const },
    { username: "accountant", password: "acc123", role: "Accountant" as const },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      const credential = demoCredentials.find(
        (cred) => cred.username === username && cred.password === password
      );

      if (credential) {
        toast({
          title: "Login successful",
          description: `Welcome back, ${username}!`,
        });
        onLogin({
          id: "user_" + credential.username,
          username: credential.username,
          role: credential.role,
        });
      } else {
        setError("Invalid username or password");
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleForgotPassword = () => {
    toast({
      title: "Password reset link sent",
      description: "Please check your email for password reset instructions.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">SchoolMaster</CardTitle>
          <CardDescription>
            Sign in to your school management portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username*</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password*</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <Label htmlFor="remember" className="text-sm">
                Remember me
              </Label>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={handleForgotPassword}
                className="text-sm"
              >
                Forgot Password?
              </Button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Demo Credentials:</h4>
            <div className="space-y-1 text-xs text-gray-600">
              <p>Admin: admin / admin123</p>
              <p>Teacher: teacher1 / teacher123</p>
              <p>Parent: parent1 / parent123</p>
              <p>Accountant: accountant / acc123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
