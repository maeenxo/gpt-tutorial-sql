import { Sequelize, DataTypes } from 'sequelize';

const sequelize = new Sequelize('gptSequelize', 'postgres', 'postgres', {
  host: 'localhost',
  dialect: 'postgres',
});

// Define models
const Toy = sequelize.define('Toy', {
  name: DataTypes.STRING,
  price: DataTypes.FLOAT,
  category: {
    type: DataTypes.STRING,
    defaultValue: 'fun',
  }
});

const Brand = sequelize.define('Brand', {
  name: DataTypes.STRING,
});

const Shop = sequelize.define('Shop', {
  name: DataTypes.STRING,
  location: DataTypes.STRING,
});

const Manual = sequelize.define('Manual', {
  instructions: DataTypes.TEXT,
});


// associations
Brand.hasMany(Toy); // One Brand makes many toys
Toy.belongsTo(Brand); // Each toy belongs to one brand

Shop.belongsToMany(Toy, { through: 'ShopToys' }); // Many-to-many relationship between Shop and Toy
Toy.belongsToMany(Shop, { through: 'ShopToys' });

Toy.hasOne(Manual); // One Toy has one Manual
Manual.belongsTo(Toy); // Each Manual belongs to one Toy


// Main function
(async () => {
  try {
    await sequelize.authenticate();  // Make sure DB is up
    console.log('✅ Connected to the database.'); // Check connection

    await sequelize.sync({ alter: true }); // Sync models with DB
    console.log('✅ Tables synced.');

    // Brand and Toy data
const seedData = [
  {
    name: 'Lego',
    toys: [
      { name: 'Lego Car', price: 19.99 },
      { name: 'Lego Train', price: 59.99 },
      { name: 'Lego Plane', price: 39.99 },
      { name: 'Lego House', price: 49.99 }
    ]
  },
  {
    name: 'Hasbro',
    toys: [
      { name: 'Nerf Gun', price: 29.99 },
      { name: 'Action Figure', price: 15.49 },
      { name: 'Transformers Bot', price: 45.99 }
    ]
  },
  {
    name: 'Mattel',
    toys: [
      { name: 'Barbie Doll', price: 24.99 },
      { name: 'Hot Wheels Car', price: 5.99 },
      { name: 'Uno Cards', price: 9.99 },
      { name: 'Fisher Price Blocks', price: 14.99 }
    ]
  },
  {
    name: 'Bandai',
    toys: [
      { name: 'Gundam Model Kit', price: 34.99 },
      { name: 'Power Rangers Sword', price: 27.99 }
    ]
  },
  {
    name: 'Spin Master',
    toys: [
      { name: 'Bakugan Toy', price: 19.49 },
      { name: 'PAW Patrol Car', price: 22.99 },
      { name: 'Kinetic Sand Set', price: 17.99 }
    ]
  },
  {
    name: 'Funko',
    toys: [
      { name: 'Funko Pop Ironman', price: 12.99 },
      { name: 'Funko Pop Batman', price: 12.99 },
      { name: 'Funko Pop Stranger Things', price: 12.99 }
    ]
  }
  

 

];

// Seed shops
const shopList = [
  { name: 'Toys R Us', location: 'New York' },
  { name: 'Hamleys', location: 'London' },
  { name: 'KidZone', location: 'Tokyo' }
];

const shops = [];

for (const shopData of shopList) {
  const [shop] = await Shop.findOrCreate({ where: { name: shopData.name }, defaults: { location: shopData.location } });
  shops.push(shop);
}

// Example: Add toys to Toys R Us
const toysRUs = shops.find(s => s.name === 'Toys R Us');
const legoToys = await Toy.findAll({ where: { name: ['Lego Car', 'Lego Train'] } });
await toysRUs.addToys(legoToys);

// Show all toys available at Toys R Us
const availableToys = await toysRUs.getToys();
console.log(`🏬 Toys available at ${toysRUs.name}:`);
availableToys.forEach(toy => {
  console.log(`- ${toy.name}, $${toy.price}`);
});

// Example: Add a manual to Lego Car
const legoCar = await Toy.findOne({ where: { name: 'Lego Car' } });

const [manual] = await Manual.findOrCreate({
  where: { ToyId: legoCar.id },
  defaults: {
    instructions: 'Step 1: Open box\nStep 2: Sort bricks\nStep 3: Build car 🚗'
  }
});

// Fetch the manual using association
const fetchedManual = await legoCar.getManual();
console.log(`📘 Manual for ${legoCar.name}:`);
console.log(fetchedManual.instructions);

// Get all toys with their manuals
const allToys = await Toy.findAll({ include: Manual });

for (const toy of allToys) {
  if (!toy.Manual) {
    await Manual.create({
      instructions: `This is the user manual for ${toy.name}. Follow the steps to enjoy your toy!`,
      ToyId: toy.id
    });
    console.log(`📘 Created manual for ${toy.name}`);
  } else {
    console.log(`✅ ${toy.name} already has a manual`);
  }
}


// Loop through brands and toys
for (const brandData of seedData) {
  const [brand] = await Brand.findOrCreate({ where: { name: brandData.name } });

  for (const toy of brandData.toys) {
    await Toy.findOrCreate({
      where: {
        name: toy.name,
        BrandId: brand.id
      },
      defaults: {
        price: toy.price
      }
    });
  }
}

const lego = await Brand.findOne({ where: { name: 'Lego' } });

// Fetch all toys for LEGO
  const toys = await lego.getToys();

  console.log('🧸 Toys made by LEGO:');
  toys.forEach(toy => {
    console.log(`- ${toy.name}, $${toy.price}`);
  });


// Count the number of toys for LEGO
  const toyCount = await lego.countToys();
console.log(`🧮 LEGO has ${toyCount} toys.`);


// Check if brand have a specific toy
// Get the brand: Spin Master
const spinMaster = await Brand.findOne({ where: { name: 'Spin Master' } });

// Get the toy: Kinetic Sand Set
const kineticSandSet = await Toy.findOne({ where: { name: 'Kinetic Sand Set' } });

// Check if Spin Master has that toy
const hasKineticSandSet = await spinMaster.hasToy(kineticSandSet);

// Show the result
console.log(`🤔 Does Spin Master have Kinetic Sand Set? ${hasKineticSandSet ? 'Yes' : 'No'}`);

// ✅ NEW: Assign an unassigned toy to LEGO
const unassignedLegoSet = await Toy.findOne({
  where: {
    name: 'Lego Set',
    BrandId: null
  }
});

const legoForAssignment = await Brand.findOne({ where: { name: 'Lego' } });

await legoForAssignment.addToy(unassignedLegoSet);

const hasIt = await legoForAssignment.hasToy(unassignedLegoSet);
console.log(`✅ Was 'Lego Set' successfully assigned to LEGO? ${hasIt ? 'Yes' : 'No'}`);




    const [legoBrand, created] = await Brand.findOrCreate({
      where: { name: 'Lego' },
    });
    
    const [toy1, toyCreated] = await Toy.findOrCreate({
      where: {
        name: 'Lego Car',
        BrandId: legoBrand.id
      },
      defaults: {
        price: 19.99
      }
    });

    // Add another brand
const [hasbroBrand] = await Brand.findOrCreate({
  where: { name: 'Hasbro' }
});

// Add toys for Hasbro
await Toy.findOrCreate({
  where: { name: 'Action Figure', BrandId: hasbroBrand.id },
  defaults: { price: 25.99 }
});

await Toy.findOrCreate({
  where: { name: 'Nerf Gun', BrandId: hasbroBrand.id },
  defaults: { price: 39.99 }
});

// Add more toys to Lego
await Toy.findOrCreate({
  where: { name: 'Lego Helicopter', BrandId: legoBrand.id },
  defaults: { price: 49.99 }
});

await Toy.findOrCreate({
  where: { name: 'Lego Train', BrandId: legoBrand.id },
  defaults: { price: 59.99 }
});


const toysWithManuals = await Toy.findAll({
  include: Manual
});

toysWithManuals.forEach(toy => {
  if (toy.Manual) {
    console.log(`✅ ${toy.name} has a manual.`);
   } else {
    console.log(`❌ ${toy.name} has no manual.`);
  }
});

    
    console.log(`✅ Toy added: ${toy1.name}, Brand: ${legoBrand.name}`);

    const brandWithToys = await Brand.findOne({
      where: { name: 'Lego' },
      include: Toy
    });

    console.log(`📦 Brand: ${brandWithToys.name}`);
    brandWithToys.Toys.forEach(toy => {
      console.log(`- ${toy.name}, $${toy.price}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
})();

console.log('👋 Goodbye 12!');