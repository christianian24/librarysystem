import { Card } from "@/components/ui/card";
import { BookOpen, Users, ArrowRightLeft, FileBarChart } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [booksResult, membersResult, transactionsResult] = await Promise.all([
        supabase.from("books").select("*", { count: "exact" }),
        supabase.from("members").select("*", { count: "exact" }),
        supabase.from("transactions").select("*").eq("status", "active"),
      ]);

      const activeTransactions = transactionsResult.data?.length || 0;
      const overdueCount = transactionsResult.data?.filter(
        (t) => new Date(t.due_date) < new Date() && t.status === "active"
      ).length || 0;

      return {
        totalBooks: booksResult.count || 0,
        totalMembers: membersResult.count || 0,
        activeTransactions,
        overdueCount,
      };
    },
  });

  const navCards = [
    {
      title: "Books",
      description: "Manage your library collection",
      icon: BookOpen,
      href: "/books",
      stat: stats?.totalBooks,
      statLabel: "Total Books",
      gradient: "from-primary to-purple-600",
    },
    {
      title: "Members",
      description: "View and manage members",
      icon: Users,
      href: "/members",
      stat: stats?.totalMembers,
      statLabel: "Total Members",
      gradient: "from-accent to-orange-600",
    },
    {
      title: "Transactions",
      description: "Issue and return books",
      icon: ArrowRightLeft,
      href: "/transactions",
      stat: stats?.activeTransactions,
      statLabel: "Active Loans",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      title: "Reports",
      description: "View statistics and summaries",
      icon: FileBarChart,
      href: "/reports",
      stat: stats?.overdueCount,
      statLabel: "Overdue Items",
      gradient: "from-red-500 to-pink-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-12 text-center">
          <div className="inline-block mb-4">
            <div className="bg-gradient-to-r from-primary to-purple-600 text-primary-foreground px-6 py-3 rounded-2xl shadow-elegant">
              <BookOpen className="inline-block w-8 h-8 mr-2" />
              <h1 className="inline-block text-3xl font-bold">Library Management System</h1>
            </div>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Efficiently manage your library's books, members, and transactions all in one place
          </p>
        </header>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {navCards.map((card) => (
            <Link key={card.href} to={card.href}>
              <Card className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 hover:border-primary/50">
                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
                <div className="p-6">
                  <div className={`w-12 h-12 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center mb-4 shadow-md`}>
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-card-foreground">{card.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{card.description}</p>
                  {card.stat !== undefined && (
                    <div className="pt-4 border-t border-border">
                      <div className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        {card.stat}
                      </div>
                      <div className="text-xs text-muted-foreground">{card.statLabel}</div>
                    </div>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Stats */}
        <Card className="p-6 bg-gradient-to-br from-card to-muted/30">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <FileBarChart className="w-6 h-6 text-primary" />
            Quick Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-card rounded-xl shadow-sm">
              <div className="text-3xl font-bold text-primary">{stats?.totalBooks || 0}</div>
              <div className="text-sm text-muted-foreground mt-1">Books in Library</div>
            </div>
            <div className="text-center p-4 bg-card rounded-xl shadow-sm">
              <div className="text-3xl font-bold text-accent">{stats?.totalMembers || 0}</div>
              <div className="text-sm text-muted-foreground mt-1">Registered Members</div>
            </div>
            <div className="text-center p-4 bg-card rounded-xl shadow-sm">
              <div className="text-3xl font-bold text-blue-500">{stats?.activeTransactions || 0}</div>
              <div className="text-sm text-muted-foreground mt-1">Books on Loan</div>
            </div>
            <div className="text-center p-4 bg-card rounded-xl shadow-sm">
              <div className="text-3xl font-bold text-destructive">{stats?.overdueCount || 0}</div>
              <div className="text-sm text-muted-foreground mt-1">Overdue Books</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
