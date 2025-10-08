import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { FileBarChart, BookOpen, Users, ArrowRightLeft, AlertTriangle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Reports = () => {
  const { data: stats } = useQuery({
    queryKey: ["reports-stats"],
    queryFn: async () => {
      const [booksResult, membersResult, transactionsResult, activeResult] = await Promise.all([
        supabase.from("books").select("*", { count: "exact" }),
        supabase.from("members").select("*", { count: "exact" }),
        supabase.from("transactions").select("*"),
        supabase.from("transactions").select("*").eq("status", "active"),
      ]);

      const allTransactions = transactionsResult.data || [];
      const activeTransactions = activeResult.data || [];

      const borrowedCount = allTransactions.filter(t => t.status === "returned").length;
      const overdueCount = activeTransactions.filter(
        t => new Date(t.due_date) < new Date()
      ).length;

      const totalBooks = booksResult.data?.reduce((sum, book) => sum + book.total_copies, 0) || 0;
      const availableBooks = booksResult.data?.reduce((sum, book) => sum + book.available_copies, 0) || 0;

      return {
        totalBooks,
        availableBooks,
        borrowedBooks: totalBooks - availableBooks,
        totalMembers: membersResult.count || 0,
        totalTransactions: allTransactions.length,
        activeLoans: activeTransactions.length,
        returnedBooks: borrowedCount,
        overdueBooks: overdueCount,
      };
    },
  });

  const { data: categoryStats } = useQuery({
    queryKey: ["category-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.from("books").select("category, total_copies");
      if (error) throw error;

      const categories: Record<string, number> = {};
      data.forEach(book => {
        categories[book.category] = (categories[book.category] || 0) + book.total_copies;
      });

      return Object.entries(categories).map(([category, count]) => ({ category, count }));
    },
  });

  const { data: overdueTransactions } = useQuery({
    queryKey: ["overdue-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          books (title, author),
          members (member_id, name)
        `)
        .eq("status", "active");

      if (error) throw error;

      return data.filter(t => new Date(t.due_date) < new Date());
    },
  });

  const { data: recentTransactions } = useQuery({
    queryKey: ["recent-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          books (title),
          members (name)
        `)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-elegant">
              <FileBarChart className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
              Reports & Analytics
            </h1>
          </div>
          <p className="text-muted-foreground">Comprehensive statistics and summaries of your library</p>
        </div>

        {/* Main Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-card to-primary/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{stats?.totalBooks || 0}</div>
                <div className="text-sm text-muted-foreground">Total Books</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Available:</span>
                <span className="font-medium text-green-600">{stats?.availableBooks || 0}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted-foreground">Borrowed:</span>
                <span className="font-medium text-blue-600">{stats?.borrowedBooks || 0}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-card to-accent/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-accent to-orange-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-accent">{stats?.totalMembers || 0}</div>
                <div className="text-sm text-muted-foreground">Total Members</div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-card to-blue-500/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <ArrowRightLeft className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats?.totalTransactions || 0}</div>
                <div className="text-sm text-muted-foreground">Total Transactions</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Active:</span>
                <span className="font-medium text-blue-600">{stats?.activeLoans || 0}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted-foreground">Returned:</span>
                <span className="font-medium text-green-600">{stats?.returnedBooks || 0}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-card to-destructive/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-destructive to-red-600 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-destructive">{stats?.overdueBooks || 0}</div>
                <div className="text-sm text-muted-foreground">Overdue Books</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Category Distribution */}
        <Card className="p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Books by Category
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categoryStats?.map((stat) => (
              <div key={stat.category} className="p-4 bg-muted/30 rounded-lg text-center">
                <div className="text-2xl font-bold text-primary">{stat.count}</div>
                <div className="text-sm text-muted-foreground">{stat.category}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Overdue Books */}
        {overdueTransactions && overdueTransactions.length > 0 && (
          <Card className="p-6 mb-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-6 h-6" />
              Overdue Items
            </h2>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-destructive/5">
                    <TableHead>Book</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Days Overdue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdueTransactions.map((transaction: any) => {
                    const daysOverdue = Math.floor(
                      (new Date().getTime() - new Date(transaction.due_date).getTime()) / (1000 * 60 * 60 * 24)
                    );
                    return (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">{transaction.books?.title}</TableCell>
                        <TableCell>{transaction.members?.name}</TableCell>
                        <TableCell>{new Date(transaction.issue_date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-destructive font-medium">
                          {new Date(transaction.due_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full text-xs bg-destructive/10 text-destructive font-medium">
                            {daysOverdue} days
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        {/* Recent Activity */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-primary" />
            Recent Transactions
          </h2>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Book</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions?.map((transaction: any) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.books?.title}</TableCell>
                    <TableCell>{transaction.members?.name}</TableCell>
                    <TableCell>{new Date(transaction.issue_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(transaction.due_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          transaction.status === "returned"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : new Date(transaction.due_date) < new Date()
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        }`}
                      >
                        {transaction.status === "returned"
                          ? "Returned"
                          : new Date(transaction.due_date) < new Date()
                          ? "Overdue"
                          : "Active"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
