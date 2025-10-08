-- Create books table
CREATE TABLE public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  availability_status TEXT NOT NULL DEFAULT 'available' CHECK (availability_status IN ('available', 'borrowed', 'reserved')),
  total_copies INTEGER NOT NULL DEFAULT 1,
  available_copies INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create members table
CREATE TABLE public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  membership_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  issue_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  return_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'returned', 'overdue')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required for this demo)
CREATE POLICY "Allow public read access on books" ON public.books FOR SELECT USING (true);
CREATE POLICY "Allow public insert on books" ON public.books FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on books" ON public.books FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on books" ON public.books FOR DELETE USING (true);

CREATE POLICY "Allow public read access on members" ON public.members FOR SELECT USING (true);
CREATE POLICY "Allow public insert on members" ON public.members FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on members" ON public.members FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on members" ON public.members FOR DELETE USING (true);

CREATE POLICY "Allow public read access on transactions" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Allow public insert on transactions" ON public.transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on transactions" ON public.transactions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on transactions" ON public.transactions FOR DELETE USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON public.books
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_books_isbn ON public.books(isbn);
CREATE INDEX idx_books_category ON public.books(category);
CREATE INDEX idx_members_member_id ON public.members(member_id);
CREATE INDEX idx_transactions_book_id ON public.transactions(book_id);
CREATE INDEX idx_transactions_member_id ON public.transactions(member_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);