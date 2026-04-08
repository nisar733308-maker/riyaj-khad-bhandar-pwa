// शुरुआती प्रोडक्ट्स की लिस्ट
const defaultProducts = [
  {
    id:1, name:'यूरिया खाद (Urea)', price:266.50, 
    desc:'नीम लेपित यूरिया (46% N)। यह पौधों के विकास के लिए सबसे महत्वपूर्ण नाइट्रोजन उर्वरक है। सरकारी मानकों के अनुसार 45kg की पैकिंग।', 
    image:'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?auto=format&fit=crop&q=80&w=500', category:'नाइट्रोजन खाद', stockStatus: 'In Stock', stockCount: 50,
    reviews: [{user: "राम सिंह", rating: 5, text: "गेहूं की फसल में बहुत अच्छा रिजल्ट मिला।"}, {user: "विजय पाल", rating: 4, text: "पैकिंग अच्छी थी।"}]
  },
  {
    id:2, name:'डीएपी खाद (DAP)', price:1650, 
    desc:'इफको डीएपी (18-46-0)। इसमें फॉस्फोरस और नाइट्रोजन की मात्रा संतुलित होती है, जो जड़ों की मजबूती के लिए अनिवार्य है। 50kg बैग।', 
    image:'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?auto=format&fit=crop&q=80&w=500', category:'फॉस्फेट खाद', stockStatus: 'Limited', stockCount: 10,
    reviews: [{user: "सोहन लाल", rating: 5, text: "असली खाद है, पैदावार बढ़ गई।"}]
  },
  {
    id:3, name:'एमओपी खाद (MOP)', price:1800, 
    desc:'म्यूरेट ऑफ पोटाश (60% K2O)। यह फसलों को रोगों से लड़ने की शक्ति देता है और फलों/अनाज की गुणवत्ता बढ़ाता है। 50kg बैग।', 
    image:'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=500', category:'पोटाश खाद', stockStatus: 'In Stock', stockCount: 30,
    reviews: [{user: "महेंद्र", rating: 4, text: "आलू की खेती के लिए बहुत बढ़िया।"}]
  },
  {
    id:4, name:'सुपर पाउडर (Super Powder)', price:550, 
    desc:'फसल की तीव्र वृद्धि और मिट्टी की उर्वरता बढ़ाने के लिए विशेष सुपर पाउडर।', 
    image:'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?auto=format&fit=crop&q=80&w=500', category:'उर्वरक', stockStatus: 'In Stock', stockCount: 100,
    reviews: []
  },
  {
    id:5, name:'सुपर ग्रेन्युल (Super Granule)', price:600, 
    desc:'दानेदार उर्वरक जो धीरे-धीरे पोषक तत्व छोड़ता है, लंबी अवधि तक फसल को पोषण देता है।', 
    image:'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&q=80&w=500', category:'उर्वरक', stockStatus: 'Limited', stockCount: 5,
    reviews: []
  },
  {
    id:6, name:'महावीर - फिप्रोनिल (Mahaveer)', price:100, 
    desc:'घारडा महावीर (Fipronil 0.3% GR) - यह मिट्टी के कीड़ों, दीमक और धान के तना छेदक (Stem Borer) के खिलाफ बहुत प्रभावशाली है।', 
    image:'https://images.unsplash.com/photo-1581578017093-cd30fce4eeb7?auto=format&fit=crop&q=80&w=500', category:'कीटनाशक', stockStatus: 'In Stock', stockCount: 40,
    reviews: []
  },
  {
    id:7, name:'जिंक (Zinc)', price:100, 
    desc:'फसलों में जिंक की कमी को पूरा करने के लिए, जिससे पैदावार में भारी बढ़ोतरी होती है।', 
    image:'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&q=80&w=500', category:'सूक्ष्म पोषक तत्व', stockStatus: 'In Stock', stockCount: 25,
    reviews: []
  },
  {
    id:8, name:'एनपीके 19:19:19 (NPK)', price:150, 
    desc:'पानी में घुलनशील उर्वरक, पौधों की शुरुआती वृद्धि के लिए बेहतरीन।', 
    image:'https://images.unsplash.com/photo-1591130901020-ef93581c62ba?auto=format&fit=crop&q=80&w=500', category:'उर्वरक', stockStatus: 'In Stock', stockCount: 60,
    reviews: [{user: "पवन", rating: 5, text: "छिड़काव के बाद सब्जी की चमक बढ़ गई।"}]
  },
  {
    id:9, name:'साग़रिका (Sagrika)', price:500, 
    desc:'समुद्री शैवाल का अर्क, जो मिट्टी की गुणवत्ता और फसल की सेहत सुधारता है।', 
    image:'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=500', category:'जैविक खाद', stockStatus: 'In Stock', stockCount: 15,
    reviews: []
  }
];

// LocalStorage से प्रोडक्ट्स लोड करें या डिफॉल्ट दिखाएं
let products = JSON.parse(localStorage.getItem('all_products')) || defaultProducts;
if(!localStorage.getItem('all_products')) localStorage.setItem('all_products', JSON.stringify(products));
