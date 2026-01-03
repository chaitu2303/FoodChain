import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowRight, Heart, Users, Truck, Shield, Building2, HandHeart, Bike, ChefHat, Clock, Leaf, MapPin, CheckCircle, Star, Award, Trophy, GraduationCap, Medal, FileText, Sparkles } from "lucide-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImpactCounter, FeatureCard, StepCard } from "@/components/common";

const features = [
  {
    icon: Clock,
    title: "Real-Time Matching",
    description: "AI-powered system instantly connects surplus food with the nearest NGO, ensuring nothing goes to waste."
  },
  {
    icon: Truck,
    title: "Smart Logistics",
    description: "Automated volunteer assignment with e-rickshaw backup when needed. No food left behind."
  },
  {
    icon: Shield,
    title: "Verified Network",
    description: "All NGOs are verified. Complete transparency in food redistribution chain."
  },
  {
    icon: Heart,
    title: "Zero Cost for NGOs",
    description: "NGOs never pay for transport. CSR-funded logistics ensure food reaches the needy."
  }
];

const volunteerBenefits = [
  {
    icon: Truck,
    title: "Logistics Experience",
    description: "Gain real-world logistics & operations experience tracking surplus food movement."
  },
  {
    icon: Building2,
    title: "NGO Exposure",
    description: "Direct exposure to NGO operations and social impact management."
  },
  {
    icon: FileText,
    title: "Verified History",
    description: "All tasks are logged. Get a verified experience record of your contributions."
  },
  {
    icon: Users,
    title: "Leadership Roles",
    description: "Opportunity to lead teams and coordinate large-scale food drives."
  },
  {
    icon: GraduationCap,
    title: "Internship Recommendations",
    description: "Top performers receive internship and project recommendations based on data."
  },
  {
    icon: Award,
    title: "Skill Development",
    description: "Sharpen your coordination, communication, and problem-solving skills."
  }
];

const howItWorks = [
  {
    icon: ChefHat,
    title: "1. Donation Creation",
    description: "Donors (restaurants, households, events) post surplus food with quantity, location, and pickup time."
  },
  {
    icon: Shield,
    title: "2. Verification & Matching",
    description: "NGOs and administrators verify the donation and match it with nearby volunteers and beneficiary NGOs."
  },
  {
    icon: Bike,
    title: "3. Volunteer Logistics",
    description: "Assigned volunteers receive pickup and drop details and complete safe food delivery."
  },
  {
    icon: HandHeart,
    title: "4. Distribution & Tracking",
    description: "NGOs distribute food to beneficiaries. Status updates are visible to donors, NGOs, and admins."
  }
];

const aboutValues = [
  {
    icon: Shield,
    title: "Transparency",
    description: "Open processes and verified partners."
  },
  {
    icon: Users,
    title: "Community-driven",
    description: "Powered by people, for people."
  },
  {
    icon: Leaf,
    title: "Sustainability",
    description: "Reducing waste, saving the planet."
  },
  {
    icon: Heart,
    title: "Trust & Accountability",
    description: "Building reliable connections."
  }
];

const missionStatement = "To reduce food waste and hunger by enabling fast, reliable, and traceable redistribution of surplus food.";
const visionStatement = "A future where no edible food is wasted and every community has access to nutritious meals.";

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Restaurant Owner, Delhi",
    content: "We used to throw away 20kg of food daily. Now it feeds 100+ people. FoodChain made it effortless.",
    avatar: "P"
  },
  {
    name: "Akshay Mehta",
    role: "Volunteer, Mumbai",
    content: "Being a FoodChain volunteer gives my weekends meaning. The app makes coordination seamless.",
    avatar: "A"
  },
  {
    name: "Lakshmi Foundation",
    role: "NGO Partner, Bangalore",
    content: "FoodChain connects us with quality surplus food daily. Our beneficiaries eat fresh, nutritious meals.",
    avatar: "L"
  }
];

export default function Index() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.substring(1));
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background with solid overlay */}
        <div className="absolute inset-0 z-0">
          <img
            alt="Community food redistribution"
            className="w-full h-full object-cover"
            src="/lovable-uploads/3620e788-183b-4863-9e32-07c09dc89466.jpg"
          />
          <div className="absolute inset-0 bg-background/90" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge variant="success" className="mb-6">
                <Leaf className="w-3 h-3 mr-1" />
                Reducing Food Waste Across India
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight"
            >
              Turn Surplus Into{" "}
              <span className="text-primary">Smiles</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 text-lg text-muted-foreground leading-relaxed"
            >
              FoodChain connects restaurants, events, and households with verified NGOs
              to redistribute surplus food to those in need. Smart logistics,
              real-time tracking, zero cost for NGOs.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 flex flex-wrap gap-4"
            >
              <Link to="/auth?mode=register">
                <Button variant="hero" size="xl">
                  Start Donating
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="outline" size="xl">
                  Learn How It Works
                </Button>
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8 flex items-center gap-6 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>100% Free for NGOs</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>Verified Partners</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>Real-time Tracking</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-20 bg-emerald-900" id="impact">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
              Our Impact
            </h2>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              Reduced food waste, increased meal access, and faster NGO operations.
            </p>
            <p className="mt-4 text-white/60 max-w-2xl mx-auto">
              FoodChain enables measurable social impact by turning surplus into sustenance while providing transparency and accountability at every step of the process.
            </p>
          </motion.div>
          {/* ... */}
        </div>
      </section>

      {/* Features - About */}
      <section className="py-20 bg-background" id="about">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-12"
          >
            <Badge variant="secondary" className="mb-4">About FoodChain</Badge>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
              Our Mission & Vision
            </h2>
            <p className="text-lg text-muted-foreground mb-8 text-left md:text-center">
              FoodChain is a technology-driven social impact platform designed to solve two major problems simultaneously: food waste and hunger.
              Every day, large quantities of edible food are wasted, while millions struggle. We bridge this gap through a transparent, accountable system.
            </p>

            <div className="grid md:grid-cols-2 gap-8 text-left">
              <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
                <h3 className="font-bold text-xl mb-2 text-primary">Mission</h3>
                <p className="text-muted-foreground">{missionStatement}</p>
              </div>
              <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
                <h3 className="font-bold text-xl mb-2 text-primary">Vision</h3>
                <p className="text-muted-foreground">{visionStatement}</p>
              </div>
            </div>
          </motion.div>

          <div className="text-center mb-10 mt-16">
            <h3 className="text-2xl font-bold mb-8">Our Core Values</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {aboutValues.map((value, index) => (
              <FeatureCard key={value.title} {...value} delay={index * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/30" id="how-it-works">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <Badge variant="secondary" className="mb-4">Simple Process</Badge>
                <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                  How FoodChain Works
                </h2>
                <p className="mt-4 text-muted-foreground">
                  From surplus to service — simple, fast, transparent.
                </p>
              </motion.div>

              <div className="mt-8 space-y-4">
                {howItWorks.map((step, index) => (
                  <StepCard
                    key={step.title}
                    number={index + 1}
                    {...step}
                    delay={index * 0.1}
                    isActive={index === 0}
                  />
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-lg">
                <img
                  src="/lovable-uploads/3620e788-183b-4863-9e32-07c09dc89466.jpg"
                  alt="Food packed for donation"
                  className="w-full h-auto"
                />
                <div className="absolute bottom-4 left-4 right-4">
                  <Card className="p-4 bg-background/95">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Ready for Pickup</p>
                        <p className="text-sm text-muted-foreground">4 meal boxes • 2.3 km away</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* User Roles */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-12"
          >
            <Badge variant="secondary" className="mb-4">Join The Movement</Badge>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              Everyone Has a Role to Play
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: ChefHat,
                title: "Food Donors",
                description: "Restaurants, caterers, event organizers, or households with surplus food.",
                features: ["Post in 30 seconds", "Track impact", "Get CSR reports"],
                cta: "Start Donating",
                href: "/auth?role=donor"
              },
              {
                icon: Building2,
                title: "NGO Partners",
                description: "Verified organizations that distribute food to communities in need.",
                features: ["Zero transport cost", "Real-time alerts", "Quality assurance"],
                cta: "Partner With Us",
                href: "/auth?role=ngo"
              },
              {
                icon: Bike,
                title: "Volunteers",
                description: "Passionate individuals who help pickup and deliver food donations.",
                features: ["Flexible hours", "Earn badges", "Make real impact"],
                cta: "Become a Volunteer",
                href: "/auth?role=volunteer"
              }
            ].map((role, index) => (
              <motion.div
                key={role.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full p-6 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
                    <role.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h3 className="font-display font-semibold text-xl">{role.title}</h3>
                  <p className="text-muted-foreground text-sm">{role.description}</p>
                  <ul className="space-y-2">
                    {role.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to={role.href}>
                    <Button variant="outline" className="w-full mt-4">
                      {role.cta}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Volunteer Benefits */}
      <section className="py-20 bg-emerald-900">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-12"
          >
            <Badge className="mb-4 bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
              <Trophy className="w-3 h-3 mr-1" />
              Volunteer Perks
            </Badge>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
              Why Volunteer With Us?
            </h2>
            <p className="text-white/70 text-lg">
              More than just volunteering – build your career, earn recognition, and make lasting impact.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {volunteerBenefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="bg-white/10 rounded-2xl p-6 h-full">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center mb-4">
                    <benefit.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-display font-semibold text-xl text-white mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-white/70 text-sm leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link to="/auth?role=volunteer">
              <Button size="xl" className="bg-emerald-500 hover:bg-emerald-600 text-white">
                <Bike className="w-5 h-5 mr-2" />
                Become a Volunteer
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-12"
          >
            <Badge variant="secondary" className="mb-4">Reviews</Badge>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              What People Say
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <p className="text-foreground leading-relaxed mb-6">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground">
              Ready to Make a Difference?
            </h2>
            <p className="mt-4 text-primary-foreground/80 text-lg">
              Join 1,500+ donors, 120+ NGOs, and 3,000+ volunteers who are
              already transforming surplus into sustenance across India.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link to="/auth?mode=register">
                <Button size="xl" className="bg-white text-primary hover:bg-white/90">
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <a href="#about">
                <Button variant="ghost" size="xl" className="text-primary-foreground hover:bg-primary-foreground/10">
                  Learn More
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
