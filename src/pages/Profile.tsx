import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Save, Loader2, Shield, Store, MapPin, Phone, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";

const AREA_COUNCILS = [
  { id: "amac", name: "Abuja Municipal Area Council (AMAC)" },
  { id: "gwagwalada", name: "Gwagwalada" },
  { id: "kuje", name: "Kuje" },
  { id: "bwari", name: "Bwari" },
  { id: "abaji", name: "Abaji" },
  { id: "kwali", name: "Kwali" },
];

const TOWNS_BY_COUNCIL: Record<string, string[]> = {
  amac: ["Wuse", "Garki", "Maitama", "Asokoro", "Utako", "Jabi", "Lugbe", "Gwarinpa", "Apo", "Nyanya", "Karu"],
  gwagwalada: ["Dobi", "Zuba", "Paiko", "Kutunku", "Gwagwalada Town"],
  kuje: ["Kuje Town", "Rubochi", "Gwagwalada Road Axis", "Chibiri", "Gwargwada"],
  bwari: ["Bwari Town", "Dutse", "Kubwa", "Byazhin", "Ushafa"],
  abaji: ["Abaji Town", "Pandagi", "Gurdi", "Rimba"],
  kwali: ["Kwali Town", "Pai", "Sheda"],
};

const YEARS_OPTIONS = ["Less than 1 year", "1-2 years", "3-5 years", "5-10 years", "More than 10 years"];
const LIKERT_SCALE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

interface ProfileData {
  full_name: string;
  phone_number: string | null;
  years_in_yard: string | null;
  area_council: string | null;
  town: string | null;
  created_at: string;
  commitment_followup_scale: number | null;
  commitment_financial_scale: number | null;
  volunteering_capacity: string | null;
  confirmation_agreement: boolean | null;
  email: string | null;
}

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [profile, setProfile] = useState<ProfileData | null>(null);

  // Form state
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [yearsInYard, setYearsInYard] = useState("");
  const [areaCouncil, setAreaCouncil] = useState("");
  const [town, setTown] = useState("");

  // New fields state
  const [commitmentFollowup, setCommitmentFollowup] = useState<number | undefined>(undefined);
  const [commitmentFinancial, setCommitmentFinancial] = useState<number | undefined>(undefined);
  const [volunteeringCapacity, setVolunteeringCapacity] = useState("");

  const { isAdmin, isSubAdmin, isSeller, loading: rolesLoading } = useUserRole(userId);

  useEffect(() => {
    checkAuthAndFetchProfile();
  }, []);

  useEffect(() => {
    // Reset town when area council changes (only if it's not from initial load)
    if (areaCouncil && profile && areaCouncil !== getAreaCouncilId(profile.area_council)) {
      setTown("");
    }
  }, [areaCouncil]);

  const getAreaCouncilId = (name: string | null): string => {
    if (!name) return "";
    const council = AREA_COUNCILS.find(c => c.name === name);
    return council?.id || "";
  };

  const getVolunteeringLabel = (value: string) => {
    switch (value) {
      case "fund_raising": return "Fund Raising";
      case "planning": return "Programme Planning at hyper-local Yarder communities";
      case "other": return "Other";
      default: return value;
    }
  };

  const checkAuthAndFetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/auth");
        return;
      }

      setUserId(session.user.id);

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("full_name, phone_number, years_in_yard, area_council, town, created_at, email, commitment_followup_scale, commitment_financial_scale, volunteering_capacity, confirmation_agreement")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile");
        return;
      }

      if (profileData) {
        const typedProfile = profileData as ProfileData;
        setProfile(typedProfile);
        setFullName(typedProfile.full_name || "");
        setPhoneNumber(typedProfile.phone_number || "");
        setYearsInYard(typedProfile.years_in_yard || "");
        setAreaCouncil(getAreaCouncilId(typedProfile.area_council));
        setTown(typedProfile.town || "");
        setCommitmentFollowup(typedProfile.commitment_followup_scale ?? undefined);
        setCommitmentFinancial(typedProfile.commitment_financial_scale ?? undefined);
        setVolunteeringCapacity(typedProfile.volunteering_capacity || "");
      }
    } catch (error) {
      console.error("Auth check error:", error);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      toast.error("Full name is required");
      return;
    }

    setSaving(true);

    const selectedCouncil = AREA_COUNCILS.find(c => c.id === areaCouncil);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        phone_number: phoneNumber.trim() || null,
        years_in_yard: yearsInYard || null,
        area_council: selectedCouncil?.name || null,
        town: town || null,
        commitment_followup_scale: commitmentFollowup,
        commitment_financial_scale: commitmentFinancial,
        volunteering_capacity: volunteeringCapacity || null,
      })
      .eq("id", userId);

    if (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated successfully");
      checkAuthAndFetchProfile();
    }

    setSaving(false);
  };

  const availableTowns = areaCouncil ? TOWNS_BY_COUNCIL[areaCouncil] || [] : [];

  if (loading || rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <Loader2 className="h-8 w-8 animate-spin text-primary-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="gap-2 text-primary-foreground hover:bg-secondary/20"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <Card className="bg-secondary">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {fullName.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-primary-foreground flex items-center justify-center gap-2 flex-wrap">
              My Profile
              <div className="flex gap-1">
                {isAdmin && (
                  <Badge className="gap-1 bg-primary text-primary-foreground">
                    <Shield className="h-3 w-3" />
                    Admin
                  </Badge>
                )}
                {isSubAdmin && !isAdmin && (
                  <Badge className="gap-1 bg-purple-600 text-white">
                    <Shield className="h-3 w-3" />
                    Sub-Admin
                  </Badge>
                )}
                {isSeller && (
                  <Badge className="gap-1 bg-accent text-accent-foreground">
                    <Store className="h-3 w-3" />
                    Seller
                  </Badge>
                )}
              </div>
            </CardTitle>
            {profile && (
              <p className="text-sm text-primary-foreground/70 flex items-center justify-center gap-1">
                <Calendar className="h-3 w-3" />
                Member since {new Date(profile.created_at).toLocaleDateString()}
              </p>
            )}
            {profile?.email && (
              <p className="text-sm text-primary-foreground/70">
                {profile.email}
              </p>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-primary-foreground">Full Name *</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="text-primary-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" />
                Phone Number
              </Label>
              <Input
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter your phone number"
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-primary-foreground">No of Years in the Yard</Label>
              <Select value={yearsInYard} onValueChange={setYearsInYard}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select years" />
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

            <div className="space-y-3">
              <Label className="text-primary-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Location (Area Council)
              </Label>
              <RadioGroup
                value={areaCouncil}
                onValueChange={setAreaCouncil}
                className="grid grid-cols-1 sm:grid-cols-2 gap-2"
              >
                {AREA_COUNCILS.map((council) => (
                  <div key={council.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={council.id} id={council.id} />
                    <Label htmlFor={council.id} className="text-sm text-primary-foreground cursor-pointer">
                      {council.name}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {areaCouncil && availableTowns.length > 0 && (
              <div className="space-y-2">
                <Label className="text-primary-foreground">Town</Label>
                <Select value={town} onValueChange={setTown}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select your town" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTowns.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-6 pt-4 border-t border-primary/20">
              <h3 className="font-semibold text-lg text-primary-foreground">Commitment Updates</h3>

              <div className="space-y-3">
                <Label className="text-primary-foreground leading-relaxed">
                  Willingness to follow-up on Yarders (0-10)
                </Label>
                <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
                  {LIKERT_SCALE.map((num) => (
                    <button
                      key={`followup-${num}`}
                      onClick={() => setCommitmentFollowup(num)}
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-md border flex items-center justify-center text-sm transition-colors ${commitmentFollowup === num
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground hover:bg-muted"
                        }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-primary-foreground leading-relaxed">
                  Willingness to support financially/participatory (0-10)
                </Label>
                <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
                  {LIKERT_SCALE.map((num) => (
                    <button
                      key={`financial-${num}`}
                      onClick={() => setCommitmentFinancial(num)}
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-md border flex items-center justify-center text-sm transition-colors ${commitmentFinancial === num
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground hover:bg-muted"
                        }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-primary-foreground">Volunteering Capacity</Label>
                <RadioGroup
                  value={volunteeringCapacity}
                  onValueChange={setVolunteeringCapacity}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fund_raising" id="vc-fund" className="border-primary-foreground/50 text-primary-foreground" />
                    <Label htmlFor="vc-fund" className="text-primary-foreground cursor-pointer">Fund Raising</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="planning" id="vc-planning" className="border-primary-foreground/50 text-primary-foreground" />
                    <Label htmlFor="vc-planning" className="text-primary-foreground cursor-pointer">Programme Planning</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="vc-other" className="border-primary-foreground/50 text-primary-foreground" />
                    <Label htmlFor="vc-other" className="text-primary-foreground cursor-pointer">Other</Label>
                  </div>
                </RadioGroup>
              </div>

              {profile?.confirmation_agreement && (
                <div className="flex items-center gap-2 mt-4 p-3 bg-green-500/20 rounded-md border border-green-500/30">
                  <CheckmarkIcon className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-green-100">Confirmed Agreement on {new Date(profile.created_at).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <Button
              onClick={handleSave}
              className="w-full gap-2"
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CheckmarkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}
