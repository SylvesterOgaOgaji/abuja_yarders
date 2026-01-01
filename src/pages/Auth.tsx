import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
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



// Removed hardcoded TOWNS_BY_COUNCIL in favor of dynamic fetch

const YEARS_OPTIONS = ["Less than 1 year", "1-2 years", "3-5 years", "6-10 years", "More than 10 years"];

const LIKERT_SCALE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const authSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Name must be at least 2 characters").optional(),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits").optional(),
  yearsInYard: z.string().min(1, "Please select years in the Yard").optional(),
  areaCouncil: z.string().min(1, "Please select your area council").optional(),
  town: z.string().min(1, "Please select your town").optional(),
  commitmentFollowup: z.number().min(0).max(10).optional(),
  commitmentFinancial: z.number().min(0).max(10).optional(),
  volunteeringCapacity: z.string().optional(),
  confirmationAgreement: z.boolean().optional(),
});

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [yearsInYard, setYearsInYard] = useState("");
  const [areaCouncil, setAreaCouncil] = useState("");
  const [town, setTown] = useState("");
  const [availableTowns, setAvailableTowns] = useState<string[]>([]);

  // New fields state
  const [commitmentFollowup, setCommitmentFollowup] = useState<number | undefined>(undefined);
  const [commitmentFinancial, setCommitmentFinancial] = useState<number | undefined>(undefined);
  const [volunteeringCapacity, setVolunteeringCapacity] = useState("");
  const [confirmationAgreement, setConfirmationAgreement] = useState(false);

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

  // Reset town when area council changes and fetch new towns
  useEffect(() => {
    setTown("");
    setAvailableTowns([]);

    if (areaCouncil) {
      const fetchTowns = async () => {
        try {
          const { data, error } = await supabase
            .from("groups")
            .select("name")
            .eq("area_council", areaCouncil)
            .eq("is_active", true)
            .order("name");

          if (error) throw error;

          if (data) {
            setAvailableTowns(data.map(g => g.name));
          }
        } catch (error) {
          console.error("Error fetching towns:", error);
          toast.error("Failed to load towns for selected council");
        }
      };

      fetchTowns();
    }
  }, [areaCouncil]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isResetPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: 'https://tipabujayarders.pages.dev/auth/update-password',
        });
        if (error) throw error;
        toast.success("Check your email for the password reset link");
        setIsResetPassword(false);
        setLoading(false);
        return;
      }

      const validation = authSchema.safeParse({
        email,
        password,
        fullName: isLogin ? undefined : fullName,
        phoneNumber: isLogin ? undefined : phoneNumber,
        yearsInYard: isLogin ? undefined : yearsInYard,
        areaCouncil: isLogin ? undefined : areaCouncil,
        town: isLogin ? undefined : town,
        commitmentFollowup: isLogin ? undefined : commitmentFollowup,
        commitmentFinancial: isLogin ? undefined : commitmentFinancial,
        volunteeringCapacity: isLogin ? undefined : volunteeringCapacity,
        confirmationAgreement: isLogin ? undefined : confirmationAgreement,
      });

      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        setLoading(false);
        return;
      }

      if (!isLogin && !confirmationAgreement) {
        toast.error("You must confirm the agreement to sign up.");
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
              commitment_followup_scale: commitmentFollowup,
              commitment_financial_scale: commitmentFinancial,
              volunteering_capacity: volunteeringCapacity,
              confirmation_date: new Date().toISOString(),
              confirmation_agreement: confirmationAgreement,
            },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) throw error;
        toast.success("Account created! Please check your email to confirm your account.");
        setIsLogin(true);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Authentication failed";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };



  // const availableTowns = areaCouncil ? TOWNS_BY_COUNCIL[areaCouncil] || [] : []; // Replaced by state

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary to-background p-4">
      <Card className="w-full max-w-md shadow-[var(--shadow-medium)] max-h-[90vh] overflow-y-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl sm:text-3xl font-bold text-center bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Abuja Yarder Meeting Point
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Leave no Yarder Behind
          </CardDescription>
          <p className="text-center text-sm text-muted-foreground mt-2">
            {isResetPassword
              ? "Enter your email to receive a reset link"
              : isLogin ? "Sign in to your account" : "Create your account"
            }
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {isResetPassword ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[var(--gradient-primary)] hover:opacity-90 transition-opacity"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
                <div className="text-center text-sm">
                  <button
                    type="button"
                    onClick={() => setIsResetPassword(false)}
                    className="text-primary hover:underline"
                  >
                    Back to Sign In
                  </button>
                </div>
              </div>
            ) : (
              <>
                {!isLogin && (
                  <>
                    <div className="space-y-6 border-b pb-6">
                      {/* Personal Bio Data */}
                      <h3 className="font-semibold text-lg">Bio Data</h3>

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
                {isLogin && !isResetPassword && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setIsResetPassword(true)}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

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

                    <div className="space-y-6 pt-4 border-t">
                      <h3 className="font-semibold text-lg">Commitment</h3>

                      <div className="space-y-3">
                        <Label className="leading-relaxed">
                          How likely when you meet a Yarder, will you remember to exchange contact and do a follow-up as regards to their well-being? <span className="text-destructive">*</span>
                        </Label>
                        <div className="flex justify-between text-xs text-muted-foreground px-1">
                          <span>Not at all likely</span>
                          <span>Extremely likely</span>
                        </div>
                        <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
                          {LIKERT_SCALE.map((num) => (
                            <button
                              key={`followup-${num}`}
                              type="button"
                              onClick={() => setCommitmentFollowup(num)}
                              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-md border flex items-center justify-center text-sm transition-colors ${commitmentFollowup === num
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background hover:bg-muted"
                                }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="leading-relaxed">
                          At what scale will you be available to commit to supporting (financially and participatory) the Abuja Yarder programme in the cause of the 2026 Cohort? <span className="text-destructive">*</span>
                        </Label>
                        <div className="flex justify-between text-xs text-muted-foreground px-1">
                          <span>Not at all likely</span>
                          <span>Extremely likely</span>
                        </div>
                        <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
                          {LIKERT_SCALE.map((num) => (
                            <button
                              key={`financial-${num}`}
                              type="button"
                              onClick={() => setCommitmentFinancial(num)}
                              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-md border flex items-center justify-center text-sm transition-colors ${commitmentFinancial === num
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background hover:bg-muted"
                                }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="leading-relaxed">
                          At what capacity can you volunteer at the hyper-local Yarder communities across your/all Area Councils and towns in the FCT for the success of all Abuja Yarder Programme in the 2026 Cohort of The Intentional Parent Academy? <span className="text-destructive">*</span>
                        </Label>
                        <RadioGroup value={volunteeringCapacity} onValueChange={setVolunteeringCapacity} className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="fund_raising" id="vc-fund" />
                            <Label htmlFor="vc-fund" className="font-normal cursor-pointer">Fund Raising</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="planning" id="vc-planning" />
                            <Label htmlFor="vc-planning" className="font-normal cursor-pointer">Programme Planning at hyper-local Yarder communities</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="other" id="vc-other" />
                            <Label htmlFor="vc-other" className="font-normal cursor-pointer">Other</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>

                    <div className="space-y-6 pt-4 border-t">
                      <h3 className="font-semibold text-lg">Confirmation</h3>
                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="confirmation"
                          checked={confirmationAgreement}
                          onCheckedChange={(checked) => setConfirmationAgreement(checked as boolean)}
                        />
                        <Label htmlFor="confirmation" className="text-sm font-normal leading-tight cursor-pointer">
                          I confirm that the information provided is correct and reflects my current place of residence within the FCT. I understand this data will be used solely for Abuja Yarders community coordination and communication. <span className="text-destructive">*</span>
                        </Label>
                      </div>
                    </div>
                  </>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg shadow-md hover:shadow-lg transition-all mt-6 py-6"
                  disabled={loading}
                >
                  {loading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
                </Button>
              </>
            )}
          </form>

          {!isResetPassword && (
            <div className="mt-4 text-center text-sm">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
