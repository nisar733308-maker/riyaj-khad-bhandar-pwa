// शुरुआती प्रोडक्ट्स की लिस्ट
const defaultProducts = [
  {
    id:1, name:'यूरिया खाद (Urea)', price:266.50, 52081506-83c43123ed6d?auto=format&fit=crop&q=80&w=800', category:'नाइट्रोजन खाद', stockStatus: 'In Stock', stockCount: 50,
    reviews: [{user: "राम सिंह", rating: 5, text: "गेहूं की फसल में बहुत अच्छा रिजल्ट मिला।"}, {user: "विजय पाल", rating: 4, text: "पैकिंग अच्छी थी।"}]
  },
  {
    और नाइट्रोजन की मात्रा संतुलित होती है, जो जड़ों की मजबूती के लिए अनिवार्य है। 50kg बैग।', 
   xt: "असली खाद है, पैदावार बढ़ गई।"}]
  },
  {
    id:3, name:'एमओपी खाद (MOP)', price:1800, 
    desc:'म्यूरेट ऑफ पोटाश (60% K2O)। यह फसलों को रोगों से लड़ने की शक्ति देता है और फलों/अनाज की गुणवत्ता बढ़ाता है। 50kg बैग।', 
    image:'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=800', category:'पोटाश खाद', stockStatus: 'In Stock', stockCount: 30,
    reviews: [{user: "महेंद्र", rating: 4, text: "आलू की खेती के लिए बहुत बढ़िया।"}]
  }
];

// Browser safe products - Global export
if (typeof window !== 'undefined') {
  window.defaultProducts = defaultProducts;
  window.products = JSON.parse(localStorage.getItem('all_products')) || defaultProducts;
  if(!localStorage.getItem('all_products')) localStorage.setItem('all_products', JSON.stringify(window.products));
}
