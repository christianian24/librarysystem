import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, ArrowRightLeft, CheckCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const Transactions = () => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    book_id: "",
    member_id: "",
    due_days: 14,
  });

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          books (title, author, isbn),
          members (member_id, name)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: books } = useQuery({
    queryKey: ["available-books"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .gt("available_copies", 0);
      if (error) throw error;
      return data;
    },
  });

  const { data: members } = useQuery({
    queryKey: ["members-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("members").select("*");
      if (error) throw error;
      return data;
    },
  });

  const issueMutation = useMutation({
    mutationFn: async (newTransaction: any) => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + newTransaction.due_days);

      const { data: transaction, error: transError } = await supabase
        .from("transactions")
        .insert([
          {
            book_id: newTransaction.book_id,
            member_id: newTransaction.member_id,
            due_date: dueDate.toISOString(),
            status: "active",
          },
        ])
        .select()
        .single();

      if (transError) throw transError;

      // Update book availability
      const { data: book } = await supabase
        .from("books")
        .select("available_copies, total_copies")
        .eq("id", newTransaction.book_id)
        .single();

      if (book) {
        const newAvailable = book.available_copies - 1;
        await supabase
          .from("books")
          .update({
            available_copies: newAvailable,
            availability_status: newAvailable > 0 ? "available" : "borrowed",
          })
          .eq("id", newTransaction.book_id);
      }

      return transaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["available-books"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      toast.success("Book issued successfully!");
      setOpen(false);
      setFormData({ book_id: "", member_id: "", due_days: 14 });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to issue book");
    },
  });

  const returnMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const { data: transaction } = await supabase
        .from("transactions")
        .select("book_id")
        .eq("id", transactionId)
        .single();

      if (!transaction) throw new Error("Transaction not found");

      await supabase
        .from("transactions")
        .update({
          return_date: new Date().toISOString(),
          status: "returned",
        })
        .eq("id", transactionId);

      // Update book availability
      const { data: book } = await supabase
        .from("books")
        .select("available_copies, total_copies")
        .eq("id", transaction.book_id)
        .single();

      if (book) {
        const newAvailable = book.available_copies + 1;
        await supabase
          .from("books")
          .update({
            available_copies: newAvailable,
            availability_status: "available",
          })
          .eq("id", transaction.book_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["available-books"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      toast.success("Book returned successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to return book");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    issueMutation.mutate(formData);
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

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
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-elegant">
              <ArrowRightLeft className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
              Transaction Management
            </h1>
          </div>
          <p className="text-muted-foreground">Issue and return books to library members</p>
        </div>

        <Card className="p-6">
          <div className="flex justify-end mb-6">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90">
                  <Plus className="w-4 h-4 mr-2" />
                  Issue Book
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Issue Book to Member</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="book_id">Select Book *</Label>
                    <Select
                      value={formData.book_id}
                      onValueChange={(value) => setFormData({ ...formData, book_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a book" />
                      </SelectTrigger>
                      <SelectContent>
                        {books?.map((book) => (
                          <SelectItem key={book.id} value={book.id}>
                            {book.title} by {book.author} (Available: {book.available_copies})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="member_id">Select Member *</Label>
                    <Select
                      value={formData.member_id}
                      onValueChange={(value) => setFormData({ ...formData, member_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a member" />
                      </SelectTrigger>
                      <SelectContent>
                        {members?.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name} ({member.member_id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="due_days">Due Period (days) *</Label>
                    <Input
                      id="due_days"
                      type="number"
                      min="1"
                      max="90"
                      value={formData.due_days}
                      onChange={(e) => setFormData({ ...formData, due_days: parseInt(e.target.value) })}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-cyan-500">
                    Issue Book
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Book</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Return Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Loading transactions...
                    </TableCell>
                  </TableRow>
                ) : transactions && transactions.length > 0 ? (
                  transactions.map((transaction: any) => (
                    <TableRow key={transaction.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="font-medium">{transaction.books?.title}</div>
                        <div className="text-sm text-muted-foreground">{transaction.books?.author}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{transaction.members?.name}</div>
                        <div className="text-sm text-muted-foreground">{transaction.members?.member_id}</div>
                      </TableCell>
                      <TableCell>{new Date(transaction.issue_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <span className={isOverdue(transaction.due_date) && transaction.status === "active" ? "text-destructive font-medium" : ""}>
                          {new Date(transaction.due_date).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        {transaction.return_date
                          ? new Date(transaction.return_date).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            transaction.status === "returned"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : isOverdue(transaction.due_date)
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          }`}
                        >
                          {transaction.status === "returned"
                            ? "Returned"
                            : isOverdue(transaction.due_date)
                            ? "Overdue"
                            : "Active"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {transaction.status === "active" && (
                          <Button
                            size="sm"
                            onClick={() => returnMutation.mutate(transaction.id)}
                            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Return
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No transactions found. Issue your first book to get started!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Transactions;
