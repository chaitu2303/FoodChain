import { Link } from "react-router-dom";
import {
    ChefHat,
    Building2,
    Bike,
    ShieldCheck,
    ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/layout";

const loginOptions = [
    {
        id: "donor",
        title: "Food Donor",
        description: "Restaurants, caterers, & individuals",
        icon: ChefHat,
        color: "text-orange-500",
        bgColor: "bg-orange-500/10",
        borderColor: "border-orange-200"
    },
    {
        id: "ngo",
        title: "NGO Partner",
        description: "Verified non-profit organizations",
        icon: Building2,
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-200"
    },
    {
        id: "volunteer",
        title: "Volunteer",
        description: "Delivery partners & helpers",
        icon: Bike,
        color: "text-emerald-500",
        bgColor: "bg-emerald-500/10",
        borderColor: "border-emerald-200"
    },
    {
        id: "admin",
        title: "Administrator",
        description: "System management",
        icon: ShieldCheck,
        color: "text-purple-500",
        bgColor: "bg-purple-500/10",
        borderColor: "border-purple-200"
    }
];

export default function LoginGateway() {
    return (
        <Layout>
            <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 bg-muted/30">
                <div className="w-full max-w-5xl space-y-8">
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl font-display font-bold">Welcome to FoodChain</h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Please select your role to continue. Each role has a dedicated portal to ensure security and streamlined access.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {loginOptions.map((option) => (
                            <Card key={option.id} className={`hover:shadow-lg transition-all duration-300 border-t-4 ${option.borderColor}`}>
                                <CardHeader className="space-y-4">
                                    <div className={`w-12 h-12 rounded-xl ${option.bgColor} flex items-center justify-center ${option.color}`}>
                                        <option.icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl">{option.title}</CardTitle>
                                        <CardDescription className="mt-2">{option.description}</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Link to={`/login/${option.id}`} className="block">
                                        <Button className="w-full group" variant="outline">
                                            Login
                                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </Button>
                                    </Link>
                                    <div className="text-center text-sm">
                                        <span className="text-muted-foreground">New here? </span>
                                        <Link to={`/signup/${option.id}`} className="text-primary hover:underline font-medium">
                                            Sign up
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
