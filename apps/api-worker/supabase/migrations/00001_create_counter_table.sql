-- Create counter table
CREATE TABLE IF NOT EXISTS public.counter (
  id INTEGER PRIMARY KEY DEFAULT 1,
  value INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT counter_single_row CHECK (id = 1)
);

-- Insert initial row
INSERT INTO public.counter (id, value)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.counter ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read the counter
CREATE POLICY "Allow public read access"
  ON public.counter
  FOR SELECT
  USING (true);

-- Create policy to allow anyone to update the counter
CREATE POLICY "Allow public update access"
  ON public.counter
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Enable Realtime replication for the counter table
ALTER PUBLICATION supabase_realtime ADD TABLE public.counter;

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.counter
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

