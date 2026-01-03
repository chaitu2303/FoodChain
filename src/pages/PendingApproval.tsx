import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ShieldAlert } from "lucide-react";

export function PendingApproval() {
    const { signOut, user, role } = useAuth();

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                    <ShieldAlert className="w-10 h-10 text-yellow-600" />
                </div>

                <h1 className="text-3xl font-display font-bold">Account Pending</h1>

                <p className="text-muted-foreground">
                    Your account has been created but requires Administrator approval before you can access the dashboard.
                </p>

                <div className="bg-muted/50 p-4 rounded-lg text-sm text-left font-mono">
                    <p className="font-semibold mb-2">Debug Info:</p>
                    <p>User ID: {user?.id?.slice(0, 8)}...</p>
                    <p>Role: {role || user?.user_metadata?.role || 'None'}</p>
                    <p>Verified: {user?.user_metadata?.is_verified ? 'Yes (Meta)' : 'No'}</p>
                </div>

                <div className="flex flex-col gap-3">
                    <Link to="/">
                        <Button variant="outline" className="w-full">Back to Home</Button>
                    </Link>
                    <Button
                        variant="destructive"
                        onClick={signOut}
                        className="w-full"
                    >
                        Log Out
                    </Button>
                </div>
            </div>
        </div>
    );
}
