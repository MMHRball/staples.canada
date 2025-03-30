const express = require('express');
const stripe = require('stripe')('sk_test_51R7sDqB6aHSb5FZ60a2S4jcTCTuOt5wU6Bm2OnbSmzGvSCAcB0F0hkVaOOGNidhnMTf07dJgheF4kUxC525c9xIA00bj5iMDzS'); // Заменить на твой секретный ключ Stripe
const bodyParser = require('body-parser');
const path = require('path');
const app = express();

// Настройки
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Данные о товарах
const products = require('./public/products.json');

// Главная страница
app.get('/', (req, res) => {
    res.render('index', { products });
});

// Страница товара
app.get('/product/:id', (req, res) => {
    const product = products.find(p => p.id == req.params.id);
    res.render('product', { product });
});

// Страница успешной оплаты
app.get('/success', (req, res) => {
    res.render('success');
});

// Страница доставки
app.get('/complete-shipping/:productId', (req, res) => {
    const product = products.find(p => p.id == req.params.productId);
    res.render('shipping', { product });
});

// Обработчик формы доставки
app.post('/complete-shipping', (req, res) => {
    // Извлекаем данные из тела запроса
    const { productId, color, name, address, city, postalCode, country } = req.body;

    // Логика обработки данных о доставке (выводим в консоль)
    console.log("Shipping Details Received:");
    console.log("Product ID:", productId);
    console.log("Color:", color);
    console.log("Name:", name);
    console.log("Address:", address);
    console.log("City:", city);
    console.log("Postal Code:", postalCode);
    console.log("Country:", country);

    // Перенаправление обратно на страницу товара
    res.redirect(`/product/${productId}`);
});

// Stripe: сессия оплаты с выбором цвета
app.post('/create-checkout-session', async (req, res) => {
    const { productId, color } = req.body;
    const product = products.find(p => p.id == productId);

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'cad',
                        product_data: {
                            name: `${product.name} (${color})`,  // Добавляем цвет в название товара
                        },
                        unit_amount: product.price * 100,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${req.protocol}://${req.get('host')}/success`,
            cancel_url: `${req.protocol}://${req.get('host')}/product/${productId}`,
        });

        res.redirect(303, session.url);
    } catch (error) {
        console.error('Error creating checkout session', error);
        res.status(500).send('Internal Server Error');
    }
});

// Запуск сервера
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
