import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

interface ProfileData {
  full_name: string;
  phone_number: string | null;
  years_in_yard: string | null;
  area_council: string | null;
  town: string | null;
  created_at: string;
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
        .select("full_name, phone_number, years_in_yard, area_council, town, created_at")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile");
        return;
      }

      if (profileData) {
        setProfile(profileData);
        setFullName(profileData.full_name || "");
        setPhoneNumber(profileData.phone_number || "");
        setYearsInYard(profileData.years_in_yard || "");
        setAreaCouncil(getAreaCouncilId(profileData.area_council));
        setTown(profileData.town || "");
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
      })
      .eq("id", userId);

    if (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated successfully");
      // Re-fetch to update the profile state
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
