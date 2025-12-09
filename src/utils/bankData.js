export const US_BANKS = [
  { name: "Bank of America", routingNumber: "026009593" },
  { name: "JPMorgan Chase", routingNumber: "021000021" },
  { name: "Wells Fargo", routingNumber: "121000248" },
  { name: "Citibank", routingNumber: "021000089" },
  { name: "U.S. Bank", routingNumber: "091000022" },
  { name: "PNC Bank", routingNumber: "043000096" },
  { name: "Capital One", routingNumber: "065000090" },
  { name: "TD Bank", routingNumber: "031201360" },
  { name: "Fifth Third Bank", routingNumber: "042000314" },
  { name: "Navy Federal Credit Union", routingNumber: "256074974" },
  { name: "USAA Federal Savings Bank", routingNumber: "314074269" },
  { name: "Charles Schwab Bank", routingNumber: "121202211" },
  { name: "Ally Bank", routingNumber: "124003116" },
  { name: "BMO Harris Bank", routingNumber: "071025661" },
  { name: "SunTrust Bank (Truist)", routingNumber: "061000104" },
  { name: "BB&T (Truist)", routingNumber: "053000196" },
  { name: "Citizens Bank", routingNumber: "211070175" },
  { name: "KeyBank", routingNumber: "041001039" },
  { name: "HSBC Bank USA", routingNumber: "021001088" },
  { name: "Regions Bank", routingNumber: "062005690" },
  { name: "M&T Bank", routingNumber: "022000046" },
  { name: "Santander Bank", routingNumber: "231372691" },
  { name: "American Express National Bank", routingNumber: "124085244" },
  { name: "Discover Bank", routingNumber: "031100649" },
  { name: "Goldman Sachs Bank USA", routingNumber: "124085066" },
  { name: "Barclays Bank Delaware", routingNumber: "031100649" },
  { name: "First Citizens Bank", routingNumber: "053100300" },
  { name: "Huntington National Bank", routingNumber: "044000024" },
  { name: "Synchrony Bank", routingNumber: "124085244" },
  { name: "MUFG Union Bank", routingNumber: "122000496" }
];

export const getBankByName = (name) => {
  return US_BANKS.find(bank => bank.name === name);
};

export const getBankByRoutingNumber = (routingNumber) => {
  return US_BANKS.find(bank => bank.routingNumber === routingNumber);
};