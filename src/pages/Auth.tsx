import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { z } from "zod";

const AREA_COUNCILS = [
  { value: "amac", label: "Abuja Municipal Area Council (AMAC)" },
  { value: "gwagwalada", label: "Gwagwalada Area Council" },
  { value: "kuje", label: "Kuje Area Council" },
  { value: "bwari", label: "Bwari Area Council" },
  { value: "abaji", label: "Abaji Area Council" },
  { value: "kwali", label: "Kwali Area Council" },
];

const TOWNS_BY_COUNCIL: Record<string, string[]> = {
  amac: ["Wuse", "Garki", "Maitama", "Asokoro", "Utako", "Jabi", "Lugbe", "Gwarinpa", "Apo", "Nyanya", "Karu"],
  gwagwalada: ["Dobi", "Zuba", "Paiko", "Kutunku", "Gwagwalada Town"],
  kuje: ["Kuje Town", "Rubochi", "Gwagwalada Road Axis", "Chibiri", "Gwargwada"],
  bwari: ["Bwari Town", "Dutse", "Kubwa", "Byazhin", "Ushafa"],
  abaji: ["Abaji Town", "Pandagi", "Gurdi", "Rimba"],
  kwali: ["Kwali Town", "Pai", "Sheda"],
};

const YEARS_OPTIONS = ["Less than 1 year", "1-2 years", "3-5 years", "6-10 years", "More than 10 years"];

const authSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Name must be at least 2 characters").optional(),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits").optional(),
  yearsInYard: z.string().min(1, "Please select years in the Yard").optional(),
  areaCouncil: z.string().min(1, "Please select your area council").optional(),
  town: z.string().min(1, "Please select your town").optional(),
});

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [yearsInYard, setYearsInYard] = useState("");
  const [areaCouncil, setAreaCouncil] = useState("");
  const [town, setTown] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkUser();
  }, [navigate]);

  // Reset town when area council changes
  useEffect(() => {
    setTown("");
  }, [areaCouncil]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validation = authSchema.safeParse({
        email,
        password,
        fullName: isLogin ? undefined : fullName,
        phoneNumber: isLogin ? undefined : phoneNumber,
        yearsInYard: isLogin ? undefined : yearsInYard,
        areaCouncil: isLogin ? undefined : areaCouncil,
        town: isLogin ? undefined : town,
      });

      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        setLoading(false);
        return;
      }

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        toast.success("Welcome back!");
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone_number: phoneNumber,
              years_in_yard: yearsInYard,
              area_council: areaCouncil,
              town: town,
            },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) throw error;
        toast.success("Account created! You can now log in.");
        setIsLogin(true);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Authentication failed";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const availableTowns = areaCouncil ? TOWNS_BY_COUNCIL[areaCouncil] || [] : [];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary to-background p-4">
      <Card className="w-full max-w-md shadow-[var(--shadow-medium)] max-h-[90vh] overflow-y-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl sm:text-3xl font-bold text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Abuja Yarders MeetingPoint
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Leave no Yarder Behind
          </CardDescription>
          <p className="text-center text-sm text-muted-foreground mt-2">
            {isLogin ? "Sign in to your account" : "Create your account"}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="yearsInYard">
                    No of years in the Yard <span className="text-destructive">*</span>
                  </Label>
                  <Select value={yearsInYard} onValueChange={setYearsInYard}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select years in the Yard" />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required={!isLogin}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">
                    Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required={!isLogin}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">
                Email Address {!isLogin && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label>
                    Location (Area Council) <span className="text-destructive">*</span>
                  </Label>
                  <RadioGroup value={areaCouncil} onValueChange={setAreaCouncil} className="space-y-2">
                    {AREA_COUNCILS.map((council) => (
                      <div key={council.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={council.value} id={council.value} />
                        <Label htmlFor={council.value} className="font-normal cursor-pointer">
                          {council.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {areaCouncil && availableTowns.length > 0 && (
                  <div className="space-y-2">
                    <Label>
                      Town <span className="text-destructive">*</span>
                    </Label>
                    <RadioGroup value={town} onValueChange={setTown} className="space-y-2">
                      {availableTowns.map((townOption) => (
                        <div key={townOption} className="flex items-center space-x-2">
                          <RadioGroupItem value={townOption} id={townOption} />
                          <Label htmlFor={townOption} className="font-normal cursor-pointer">
                            {townOption}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )}
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[var(--gradient-primary)] hover:opacity-90 transition-opacity"
              disabled={loading}
            >
              {loading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
