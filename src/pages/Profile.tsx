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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Save, Loader2, Shield, Store, MapPin, Phone, Calendar, User, FileText } from "lucide-react";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { Textarea } from "@/components/ui/textarea";

const AREA_COUNCILS = [
  { id: "amac", name: "Abuja Municipal Area Council (AMAC)" },
  { id: "gwagwalada", name: "Gwagwalada" },
  { id: "kuje", name: "Kuje" },
  { id: "bwari", name: "Bwari" },
  { id: "abaji", name: "Abaji" },
  { id: "kwali", name: "Kwali" },
];

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
  birth_day: number | null;
  birth_month: number | null;
  avatar_url: string | null;
  bio: string | null;
}

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Form state
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bio, setBio] = useState("");
  const [yearsInYard, setYearsInYard] = useState("");
  const [areaCouncil, setAreaCouncil] = useState("");
  const [town, setTown] = useState("");
  const [availableTowns, setAvailableTowns] = useState<string[]>([]);

  // New fields state
  const [commitmentFollowup, setCommitmentFollowup] = useState<number | undefined>(undefined);
  const [commitmentFinancial, setCommitmentFinancial] = useState<number | undefined>(undefined);
  const [volunteeringCapacity, setVolunteeringCapacity] = useState("");
  const [birthDay, setBirthDay] = useState<string>("");
  const [birthMonth, setBirthMonth] = useState<string>("");

  const MONTHS = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const DAYS = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));

  const { isAdmin, isSubAdmin, isSeller, loading: rolesLoading } = useUserRole(userId);

  useEffect(() => {
    checkAuthAndFetchProfile();
  }, []);

  useEffect(() => {
    // Fetch towns when area council changes
    const fetchTowns = async () => {
      if (!areaCouncil) {
        setAvailableTowns([]);
        return;
      }

      // We fetch all active groups and filter in JS to be robust against 
      // whether the DB stores the ID ('kuje') or the Name ('Kuje')
      const selectedCouncil = AREA_COUNCILS.find(c => c.id === areaCouncil);
      const councilName = selectedCouncil?.name;

      const { data } = await supabase
        .from("groups")
        .select("name, area_council")
        .eq("is_active", true);

      if (data) {
        const matchingGroups = data.filter(g =>
          g.area_council?.toLowerCase() === areaCouncil.toLowerCase() ||
          (councilName && g.area_council?.toLowerCase() === councilName.toLowerCase())
        );
        const towns = matchingGroups.map(g => g.name).sort();
        // Remove duplicates if any
        setAvailableTowns([...new Set(towns)]);
      }
    };

    fetchTowns();
  }, [areaCouncil]);

  const getAreaCouncilId = (name: string | null): string => {
    if (!name) return "";
    // Try to find by name, or if it matches an ID directly
    const councilByName = AREA_COUNCILS.find(c => c.name === name);
    if (councilByName) return councilByName.id;

    const councilById = AREA_COUNCILS.find(c => c.id === name?.toLowerCase());
    return councilById ? councilById.id : "";
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
        .select("full_name, phone_number, bio, years_in_yard, area_council, town, created_at, commitment_followup_scale, commitment_financial_scale, volunteering_capacity, confirmation_agreement, birth_day, birth_month, avatar_url")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile");
        return;
      }

      if (profileData) {
        const typedProfile = {
          ...(profileData as any),
          email: session.user.email || null
        } as ProfileData;
        setProfile(typedProfile);
        setFullName(typedProfile.full_name || "");
        setPhoneNumber(typedProfile.phone_number || "");
        setBio(typedProfile.bio || "");
        setYearsInYard(typedProfile.years_in_yard || "");
        setAreaCouncil(getAreaCouncilId(typedProfile.area_council));
        setTown(typedProfile.town || "");
        setCommitmentFollowup(typedProfile.commitment_followup_scale ?? undefined);
        setCommitmentFinancial(typedProfile.commitment_financial_scale ?? undefined);
        setVolunteeringCapacity(typedProfile.volunteering_capacity || "");

        if (typedProfile.birth_day && typedProfile.birth_month) {
          setBirthDay(typedProfile.birth_day.toString().padStart(2, '0'));
          setBirthMonth(typedProfile.birth_month.toString().padStart(2, '0'));
        }
        setAvatarUrl(typedProfile.avatar_url || null);
      }
    } catch (error) {
      console.error("Auth check error:", error);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      setSaving(true);
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`; // Use folder structure for cleaner bucket

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true }); // Enable upsert

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setAvatarUrl(publicUrl);

      // Auto-save the avatar URL to profile immediately
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", userId);

      if (updateError) throw updateError;

      toast.success("Profile picture updated!");
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error('Error uploading avatar');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      toast.error("Full name is required");
      return;
    }

    setSaving(true);

    const selectedCouncil = AREA_COUNCILS.find(c => c.id === areaCouncil);

    const bDay = birthDay ? parseInt(birthDay) : null;
    const bMonth = birthMonth ? parseInt(birthMonth) : null;

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        phone_number: phoneNumber.trim() || null,
        bio: bio.trim() || null,
        years_in_yard: yearsInYard || null,
        area_council: selectedCouncil?.name || null,
        town: town || null,
        commitment_followup_scale: commitmentFollowup,
        commitment_financial_scale: commitmentFinancial,
        volunteering_capacity: volunteeringCapacity || null,
        birth_day: bDay,
        birth_month: bMonth
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
            <div className="flex flex-col items-center mb-4 gap-2">
              <div className="relative group cursor-pointer">
                <Avatar className="h-24 w-24 border-2 border-primary/20">
                  <AvatarImage src={avatarUrl || ""} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {fullName.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div
                  className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                >
                  <span className="text-white text-xs font-medium">Change</span>
                </div>
              </div>
              <Input
                type="file"
                id="avatar-upload"
                className="hidden"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={saving}
              />
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
              <Label className="text-primary-foreground">Date of Birth (Day & Month)</Label>
              <div className="flex gap-4">
                <Select value={birthDay} onValueChange={setBirthDay}>
                  <SelectTrigger className="bg-background w-24">
                    <SelectValue placeholder="Day" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={birthMonth} onValueChange={setBirthMonth}>
                  <SelectTrigger className="bg-background flex-1">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
              <Label htmlFor="bio" className="text-primary-foreground flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Bio / Description
              </Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us a bit about yourself..."
                className="bg-background min-h-[100px]"
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
