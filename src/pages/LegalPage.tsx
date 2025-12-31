import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LegalPage() {
    const { type } = useParams();
    const navigate = useNavigate();
    const [content, setContent] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState("");

    useEffect(() => {
        const fetchContent = async () => {
            setLoading(true);
            let key = "";
            let pageTitle = "";

            switch (type) {
                case "terms":
                    key = "legal_terms";
                    pageTitle = "Terms and Conditions";
                    break;
                case "privacy":
                    key = "legal_privacy";
                    pageTitle = "Privacy Policy";
                    break;
                case "contact":
                    key = "legal_contact";
                    pageTitle = "Contact Us";
                    break;
                case "delete-account":
                    pageTitle = "Delete Account";
                    break;
                default:
                    pageTitle = "Page Not Found";
            }

            setTitle(pageTitle);

            if (type === "delete-account") {
                setContent("To delete your account, please contact our support team at jvimpactvrinitiativeltdgte@gmail.com or use the button below to initiate a request. Note that this action is irreversible and will remove all your personal data from our systems.");
                setLoading(false);
                return;
            }

            if (key) {
                const { data, error } = await supabase
                    .from("dashboard_content")
                    .select("value")
                    .eq("key", key)
                    .single();

                if (data) {
                    setContent(data.value || "Content not available.");
                } else {
                    console.error("Error fetching content:", error);
                    setContent("Failed to load content.");
                }
            } else {
                setContent("Invalid page type.");
            }
            setLoading(false);
        };

        fetchContent();
    }, [type]);

    const handleDeleteRequest = () => {
        window.open("mailto:jvimpactvrinitiativeltdgte@gmail.com?subject=Delete Account Request&body=Please delete my account associated with this email.", "_blank");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <header className="border-b px-4 py-4 flex items-center gap-4 bg-card">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-bold">{title}</h1>
            </header>

            <main className="flex-1 container max-w-3xl mx-auto py-8 px-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl text-primary">{title}</CardTitle>
                    </CardHeader>
                    <CardContent className="prose dark:prose-invert max-w-none">
                        <div className="whitespace-pre-wrap">{content}</div>

                        {type === "delete-account" && (
                            <div className="mt-8 pt-6 border-t">
                                <Button variant="destructive" onClick={handleDeleteRequest}>
                                    Request Account Deletion via Email
                                </Button>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Alternatively, you can contact admin directly on WhatsApp.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
