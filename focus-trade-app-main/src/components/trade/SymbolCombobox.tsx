import { useState } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const COMMON_SYMBOLS = [
  // Major Indices
  { value: 'NAS100', label: 'NAS100', category: 'Indices' },
  { value: 'US30', label: 'US30', category: 'Indices' },
  { value: 'SPX500', label: 'SPX500', category: 'Indices' },
  { value: 'US500', label: 'US500', category: 'Indices' },
  { value: 'US2000', label: 'US2000', category: 'Indices' },
  { value: 'GER40', label: 'GER40', category: 'Indices' },
  { value: 'UK100', label: 'UK100', category: 'Indices' },
  { value: 'FRA40', label: 'FRA40', category: 'Indices' },
  { value: 'EU50', label: 'EU50', category: 'Indices' },
  { value: 'JP225', label: 'JP225', category: 'Indices' },
  { value: 'AUS200', label: 'AUS200', category: 'Indices' },
  { value: 'HK50', label: 'HK50', category: 'Indices' },
  { value: 'CHINA50', label: 'CHINA50', category: 'Indices' },
  { value: 'VIX', label: 'VIX', category: 'Indices' },
  // Major Forex Pairs
  { value: 'EURUSD', label: 'EURUSD', category: 'Forex' },
  { value: 'GBPUSD', label: 'GBPUSD', category: 'Forex' },
  { value: 'USDJPY', label: 'USDJPY', category: 'Forex' },
  { value: 'USDCHF', label: 'USDCHF', category: 'Forex' },
  { value: 'AUDUSD', label: 'AUDUSD', category: 'Forex' },
  { value: 'USDCAD', label: 'USDCAD', category: 'Forex' },
  { value: 'NZDUSD', label: 'NZDUSD', category: 'Forex' },
  // Cross Pairs
  { value: 'EURGBP', label: 'EURGBP', category: 'Forex' },
  { value: 'EURJPY', label: 'EURJPY', category: 'Forex' },
  { value: 'GBPJPY', label: 'GBPJPY', category: 'Forex' },
  { value: 'EURAUD', label: 'EURAUD', category: 'Forex' },
  { value: 'GBPAUD', label: 'GBPAUD', category: 'Forex' },
  { value: 'EURNZD', label: 'EURNZD', category: 'Forex' },
  { value: 'GBPNZD', label: 'GBPNZD', category: 'Forex' },
  { value: 'EURCAD', label: 'EURCAD', category: 'Forex' },
  { value: 'GBPCAD', label: 'GBPCAD', category: 'Forex' },
  { value: 'AUDCAD', label: 'AUDCAD', category: 'Forex' },
  { value: 'AUDNZD', label: 'AUDNZD', category: 'Forex' },
  { value: 'AUDJPY', label: 'AUDJPY', category: 'Forex' },
  { value: 'NZDJPY', label: 'NZDJPY', category: 'Forex' },
  { value: 'CADJPY', label: 'CADJPY', category: 'Forex' },
  { value: 'CHFJPY', label: 'CHFJPY', category: 'Forex' },
  { value: 'EURCHF', label: 'EURCHF', category: 'Forex' },
  { value: 'GBPCHF', label: 'GBPCHF', category: 'Forex' },
  { value: 'AUDCHF', label: 'AUDCHF', category: 'Forex' },
  { value: 'NZDCHF', label: 'NZDCHF', category: 'Forex' },
  { value: 'CADCHF', label: 'CADCHF', category: 'Forex' },
  // Exotic Pairs
  { value: 'USDZAR', label: 'USDZAR', category: 'Forex' },
  { value: 'USDMXN', label: 'USDMXN', category: 'Forex' },
  { value: 'USDSEK', label: 'USDSEK', category: 'Forex' },
  { value: 'USDNOK', label: 'USDNOK', category: 'Forex' },
  { value: 'USDSGD', label: 'USDSGD', category: 'Forex' },
  { value: 'USDHKD', label: 'USDHKD', category: 'Forex' },
  { value: 'USDTRY', label: 'USDTRY', category: 'Forex' },
  { value: 'USDPLN', label: 'USDPLN', category: 'Forex' },
  { value: 'USDDKK', label: 'USDDKK', category: 'Forex' },
  { value: 'USDCNH', label: 'USDCNH', category: 'Forex' },
  { value: 'USDINR', label: 'USDINR', category: 'Forex' },
  { value: 'EURSEK', label: 'EURSEK', category: 'Forex' },
  { value: 'EURNOK', label: 'EURNOK', category: 'Forex' },
  { value: 'EURPLN', label: 'EURPLN', category: 'Forex' },
  { value: 'EURTRY', label: 'EURTRY', category: 'Forex' },
  // Precious Metals
  { value: 'XAUUSD', label: 'XAUUSD (Gold)', category: 'Commodities' },
  { value: 'GOLD', label: 'GOLD', category: 'Commodities' },
  { value: 'XAGUSD', label: 'XAGUSD (Silver)', category: 'Commodities' },
  { value: 'SILVER', label: 'SILVER', category: 'Commodities' },
  { value: 'XPTUSD', label: 'XPTUSD (Platinum)', category: 'Commodities' },
  { value: 'XPDUSD', label: 'XPDUSD (Palladium)', category: 'Commodities' },
  // Energy
  { value: 'USOIL', label: 'USOIL (WTI Crude)', category: 'Commodities' },
  { value: 'UKOIL', label: 'UKOIL (Brent)', category: 'Commodities' },
  { value: 'NGAS', label: 'NGAS (Natural Gas)', category: 'Commodities' },
  // Agricultural
  { value: 'WHEAT', label: 'WHEAT', category: 'Commodities' },
  { value: 'CORN', label: 'CORN', category: 'Commodities' },
  { value: 'SOYBEAN', label: 'SOYBEAN', category: 'Commodities' },
  { value: 'COFFEE', label: 'COFFEE', category: 'Commodities' },
  { value: 'SUGAR', label: 'SUGAR', category: 'Commodities' },
  { value: 'COTTON', label: 'COTTON', category: 'Commodities' },
  { value: 'COCOA', label: 'COCOA', category: 'Commodities' },
  // Major Crypto
  { value: 'BTCUSD', label: 'BTCUSD', category: 'Crypto' },
  { value: 'ETHUSD', label: 'ETHUSD', category: 'Crypto' },
  { value: 'BTCUSDT', label: 'BTCUSDT', category: 'Crypto' },
  { value: 'ETHUSDT', label: 'ETHUSDT', category: 'Crypto' },
  { value: 'BNBUSD', label: 'BNBUSD', category: 'Crypto' },
  { value: 'BNBUSDT', label: 'BNBUSDT', category: 'Crypto' },
  { value: 'SOLUSD', label: 'SOLUSD', category: 'Crypto' },
  { value: 'SOLUSDT', label: 'SOLUSDT', category: 'Crypto' },
  { value: 'XRPUSD', label: 'XRPUSD', category: 'Crypto' },
  { value: 'XRPUSDT', label: 'XRPUSDT', category: 'Crypto' },
  { value: 'ADAUSD', label: 'ADAUSD', category: 'Crypto' },
  { value: 'ADAUSDT', label: 'ADAUSDT', category: 'Crypto' },
  { value: 'DOGEUSD', label: 'DOGEUSD', category: 'Crypto' },
  { value: 'DOGEUSDT', label: 'DOGEUSDT', category: 'Crypto' },
  { value: 'AVAXUSD', label: 'AVAXUSD', category: 'Crypto' },
  { value: 'AVAXUSDT', label: 'AVAXUSDT', category: 'Crypto' },
  { value: 'LINKUSD', label: 'LINKUSD', category: 'Crypto' },
  { value: 'MATICUSD', label: 'MATICUSD', category: 'Crypto' },
  { value: 'DOTUSD', label: 'DOTUSD', category: 'Crypto' },
  { value: 'LTCUSD', label: 'LTCUSD', category: 'Crypto' },
  { value: 'SHIBUSD', label: 'SHIBUSD', category: 'Crypto' },
  { value: 'ATOMUSD', label: 'ATOMUSD', category: 'Crypto' },
  { value: 'UNIUSD', label: 'UNIUSD', category: 'Crypto' },
  { value: 'NEARUSD', label: 'NEARUSD', category: 'Crypto' },
  { value: 'APTUSD', label: 'APTUSD', category: 'Crypto' },
  { value: 'ARBUSD', label: 'ARBUSD', category: 'Crypto' },
  { value: 'OPUSD', label: 'OPUSD', category: 'Crypto' },
  { value: 'SUIUSD', label: 'SUIUSD', category: 'Crypto' },
  // Major US Stocks
  { value: 'AAPL', label: 'AAPL (Apple)', category: 'Stocks' },
  { value: 'TSLA', label: 'TSLA (Tesla)', category: 'Stocks' },
  { value: 'NVDA', label: 'NVDA (NVIDIA)', category: 'Stocks' },
  { value: 'AMZN', label: 'AMZN (Amazon)', category: 'Stocks' },
  { value: 'GOOGL', label: 'GOOGL (Google)', category: 'Stocks' },
  { value: 'GOOG', label: 'GOOG (Google)', category: 'Stocks' },
  { value: 'META', label: 'META (Meta)', category: 'Stocks' },
  { value: 'MSFT', label: 'MSFT (Microsoft)', category: 'Stocks' },
  { value: 'AMD', label: 'AMD', category: 'Stocks' },
  { value: 'INTC', label: 'INTC (Intel)', category: 'Stocks' },
  { value: 'NFLX', label: 'NFLX (Netflix)', category: 'Stocks' },
  { value: 'DIS', label: 'DIS (Disney)', category: 'Stocks' },
  { value: 'BA', label: 'BA (Boeing)', category: 'Stocks' },
  { value: 'JPM', label: 'JPM (JPMorgan)', category: 'Stocks' },
  { value: 'V', label: 'V (Visa)', category: 'Stocks' },
  { value: 'MA', label: 'MA (Mastercard)', category: 'Stocks' },
  { value: 'WMT', label: 'WMT (Walmart)', category: 'Stocks' },
  { value: 'JNJ', label: 'JNJ (Johnson & Johnson)', category: 'Stocks' },
  { value: 'PG', label: 'PG (Procter & Gamble)', category: 'Stocks' },
  { value: 'KO', label: 'KO (Coca-Cola)', category: 'Stocks' },
  { value: 'PEP', label: 'PEP (PepsiCo)', category: 'Stocks' },
  { value: 'MCD', label: 'MCD (McDonald\'s)', category: 'Stocks' },
  { value: 'NKE', label: 'NKE (Nike)', category: 'Stocks' },
  { value: 'SBUX', label: 'SBUX (Starbucks)', category: 'Stocks' },
  { value: 'PYPL', label: 'PYPL (PayPal)', category: 'Stocks' },
  { value: 'SQ', label: 'SQ (Block)', category: 'Stocks' },
  { value: 'COIN', label: 'COIN (Coinbase)', category: 'Stocks' },
  { value: 'PLTR', label: 'PLTR (Palantir)', category: 'Stocks' },
  { value: 'UBER', label: 'UBER', category: 'Stocks' },
  { value: 'ABNB', label: 'ABNB (Airbnb)', category: 'Stocks' },
  { value: 'CRM', label: 'CRM (Salesforce)', category: 'Stocks' },
  { value: 'ORCL', label: 'ORCL (Oracle)', category: 'Stocks' },
  { value: 'IBM', label: 'IBM', category: 'Stocks' },
  { value: 'CSCO', label: 'CSCO (Cisco)', category: 'Stocks' },
  { value: 'XOM', label: 'XOM (Exxon)', category: 'Stocks' },
  { value: 'CVX', label: 'CVX (Chevron)', category: 'Stocks' },
  { value: 'BAC', label: 'BAC (Bank of America)', category: 'Stocks' },
  { value: 'WFC', label: 'WFC (Wells Fargo)', category: 'Stocks' },
  { value: 'GS', label: 'GS (Goldman Sachs)', category: 'Stocks' },
  { value: 'MS', label: 'MS (Morgan Stanley)', category: 'Stocks' },
  { value: 'C', label: 'C (Citigroup)', category: 'Stocks' },
  { value: 'BRK.B', label: 'BRK.B (Berkshire)', category: 'Stocks' },
  { value: 'UNH', label: 'UNH (UnitedHealth)', category: 'Stocks' },
  { value: 'HD', label: 'HD (Home Depot)', category: 'Stocks' },
  { value: 'LOW', label: 'LOW (Lowe\'s)', category: 'Stocks' },
  { value: 'TGT', label: 'TGT (Target)', category: 'Stocks' },
  { value: 'COST', label: 'COST (Costco)', category: 'Stocks' },
  { value: 'LMT', label: 'LMT (Lockheed Martin)', category: 'Stocks' },
  { value: 'RTX', label: 'RTX (Raytheon)', category: 'Stocks' },
  { value: 'CAT', label: 'CAT (Caterpillar)', category: 'Stocks' },
  { value: 'DE', label: 'DE (Deere)', category: 'Stocks' },
  { value: 'F', label: 'F (Ford)', category: 'Stocks' },
  { value: 'GM', label: 'GM (General Motors)', category: 'Stocks' },
  { value: 'RIVN', label: 'RIVN (Rivian)', category: 'Stocks' },
  { value: 'LCID', label: 'LCID (Lucid)', category: 'Stocks' },
  { value: 'ARM', label: 'ARM (Arm Holdings)', category: 'Stocks' },
  { value: 'SMCI', label: 'SMCI (Super Micro)', category: 'Stocks' },
  { value: 'MSTR', label: 'MSTR (MicroStrategy)', category: 'Stocks' },
  { value: 'AVGO', label: 'AVGO (Broadcom)', category: 'Stocks' },
  { value: 'MU', label: 'MU (Micron)', category: 'Stocks' },
  { value: 'QCOM', label: 'QCOM (Qualcomm)', category: 'Stocks' },
  { value: 'TXN', label: 'TXN (Texas Instruments)', category: 'Stocks' },
  { value: 'AMAT', label: 'AMAT (Applied Materials)', category: 'Stocks' },
  { value: 'LRCX', label: 'LRCX (Lam Research)', category: 'Stocks' },
  { value: 'ASML', label: 'ASML', category: 'Stocks' },
  { value: 'TSM', label: 'TSM (Taiwan Semi)', category: 'Stocks' },
  { value: 'SNOW', label: 'SNOW (Snowflake)', category: 'Stocks' },
  { value: 'PANW', label: 'PANW (Palo Alto)', category: 'Stocks' },
  { value: 'CRWD', label: 'CRWD (CrowdStrike)', category: 'Stocks' },
  { value: 'ZS', label: 'ZS (Zscaler)', category: 'Stocks' },
  { value: 'NET', label: 'NET (Cloudflare)', category: 'Stocks' },
  { value: 'DDOG', label: 'DDOG (Datadog)', category: 'Stocks' },
  { value: 'NOW', label: 'NOW (ServiceNow)', category: 'Stocks' },
  { value: 'ADBE', label: 'ADBE (Adobe)', category: 'Stocks' },
  { value: 'SHOP', label: 'SHOP (Shopify)', category: 'Stocks' },
  { value: 'SE', label: 'SE (Sea Limited)', category: 'Stocks' },
  { value: 'MELI', label: 'MELI (MercadoLibre)', category: 'Stocks' },
  { value: 'BABA', label: 'BABA (Alibaba)', category: 'Stocks' },
  { value: 'JD', label: 'JD (JD.com)', category: 'Stocks' },
  { value: 'PDD', label: 'PDD (Pinduoduo)', category: 'Stocks' },
  { value: 'BIDU', label: 'BIDU (Baidu)', category: 'Stocks' },
  { value: 'NIO', label: 'NIO', category: 'Stocks' },
  { value: 'XPEV', label: 'XPEV (XPeng)', category: 'Stocks' },
  { value: 'LI', label: 'LI (Li Auto)', category: 'Stocks' },
  // ETFs
  { value: 'SPY', label: 'SPY (S&P 500 ETF)', category: 'ETFs' },
  { value: 'QQQ', label: 'QQQ (Nasdaq ETF)', category: 'ETFs' },
  { value: 'IWM', label: 'IWM (Russell 2000 ETF)', category: 'ETFs' },
  { value: 'DIA', label: 'DIA (Dow Jones ETF)', category: 'ETFs' },
  { value: 'VTI', label: 'VTI (Total Stock Market)', category: 'ETFs' },
  { value: 'VOO', label: 'VOO (Vanguard S&P 500)', category: 'ETFs' },
  { value: 'ARKK', label: 'ARKK (ARK Innovation)', category: 'ETFs' },
  { value: 'ARKW', label: 'ARKW (ARK Web)', category: 'ETFs' },
  { value: 'XLF', label: 'XLF (Financials)', category: 'ETFs' },
  { value: 'XLE', label: 'XLE (Energy)', category: 'ETFs' },
  { value: 'XLK', label: 'XLK (Technology)', category: 'ETFs' },
  { value: 'XLV', label: 'XLV (Healthcare)', category: 'ETFs' },
  { value: 'SOXL', label: 'SOXL (Semiconductors 3x)', category: 'ETFs' },
  { value: 'TQQQ', label: 'TQQQ (Nasdaq 3x)', category: 'ETFs' },
  { value: 'SQQQ', label: 'SQQQ (Nasdaq -3x)', category: 'ETFs' },
  { value: 'UVXY', label: 'UVXY (VIX 1.5x)', category: 'ETFs' },
  { value: 'GLD', label: 'GLD (Gold ETF)', category: 'ETFs' },
  { value: 'SLV', label: 'SLV (Silver ETF)', category: 'ETFs' },
  { value: 'USO', label: 'USO (Oil ETF)', category: 'ETFs' },
  { value: 'TLT', label: 'TLT (20+ Year Treasury)', category: 'ETFs' },
  { value: 'HYG', label: 'HYG (High Yield Bond)', category: 'ETFs' },
  { value: 'EEM', label: 'EEM (Emerging Markets)', category: 'ETFs' },
  { value: 'EFA', label: 'EFA (Developed Markets)', category: 'ETFs' },
  { value: 'FXI', label: 'FXI (China Large-Cap)', category: 'ETFs' },
  { value: 'KWEB', label: 'KWEB (China Internet)', category: 'ETFs' },
];

interface SymbolComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

export function SymbolCombobox({ value, onChange }: SymbolComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const categories = ['Indices', 'Forex', 'Commodities', 'Crypto', 'Stocks', 'ETFs'];

  const filteredSymbols = COMMON_SYMBOLS.filter(
    (symbol) =>
      symbol.value.toLowerCase().includes(searchValue.toLowerCase()) ||
      symbol.category.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue.toUpperCase());
    setOpen(false);
    setSearchValue('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-11 bg-muted/50 border-border hover:bg-muted font-mono text-sm"
        >
          {value || <span className="text-muted-foreground">Select symbol...</span>}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 bg-popover border-border shadow-lg z-50" align="start" sideOffset={4}>
        <Command className="bg-popover rounded-lg">
          <div className="flex items-center border-b border-border px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <CommandInput 
              placeholder="Search symbol..." 
              value={searchValue}
              onValueChange={setSearchValue}
              className="border-0 focus:ring-0"
            />
          </div>
          <CommandList className="max-h-[300px] overflow-y-auto">
            <CommandEmpty>
              <div className="p-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm"
                  onClick={() => handleSelect(searchValue)}
                >
                  Use "{searchValue.toUpperCase()}"
                </Button>
              </div>
            </CommandEmpty>
            {categories.map((category) => {
              const categorySymbols = filteredSymbols.filter(
                (s) => s.category === category
              );
              if (categorySymbols.length === 0) return null;
              return (
                <CommandGroup key={category} heading={category} className="px-2">
                  {categorySymbols.map((symbol) => (
                    <CommandItem
                      key={symbol.value}
                      value={symbol.value}
                      onSelect={handleSelect}
                      className="cursor-pointer rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === symbol.value ? 'opacity-100 text-emerald-500' : 'opacity-0'
                        )}
                      />
                      <span className="font-mono">{symbol.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
