-- Create bids table for auction functionality
CREATE TABLE IF NOT EXISTS public.bids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL,
  user_id UUID NOT NULL,
  item_name TEXT NOT NULL,
  item_description TEXT,
  item_image_url TEXT,
  starting_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  current_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'cancelled')),
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bid_offers table for tracking individual bids
CREATE TABLE IF NOT EXISTS public.bid_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bid_id UUID NOT NULL REFERENCES public.bids(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  offer_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bid_offers ENABLE ROW LEVEL SECURITY;

-- RLS policies for bids
CREATE POLICY "Users can view bids in their groups" 
ON public.bids FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM group_members 
  WHERE group_members.group_id = bids.group_id 
  AND group_members.user_id = auth.uid()
));

CREATE POLICY "Users can create bids in their groups" 
ON public.bids FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM group_members 
  WHERE group_members.group_id = bids.group_id 
  AND group_members.user_id = auth.uid()
) AND user_id = auth.uid());

CREATE POLICY "Users can update their own bids" 
ON public.bids FOR UPDATE 
USING (user_id = auth.uid());

-- RLS policies for bid_offers
CREATE POLICY "Users can view offers for bids in their groups" 
ON public.bid_offers FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM bids
  JOIN group_members ON group_members.group_id = bids.group_id
  WHERE bids.id = bid_offers.bid_id 
  AND group_members.user_id = auth.uid()
));

CREATE POLICY "Users can create offers for bids in their groups" 
ON public.bid_offers FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM bids
  JOIN group_members ON group_members.group_id = bids.group_id
  WHERE bids.id = bid_offers.bid_id 
  AND group_members.user_id = auth.uid()
) AND user_id = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.bids;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bid_offers;