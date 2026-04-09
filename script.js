const urlParams = new URLSearchParams(window.location.search);
const userPhone = urlParams.get('tg_id');

// 1. Saytdan keladigan murakkab JSONni bizning Mini App tushunadigan formatga o'tkazish
function transformData(apiResponse) {
    if (!apiResponse || apiResponse.status !== "success") return [];

    return apiResponse.order_matrix.map(order => {
        // Har bir post (Arra, Kromka...) bo'yicha ma'lumotlarni yig'amiz
        const steps = Object.keys(order.post_data).map(postName => {
            const item = order.post_data[postName];
            
            // Foizni hisoblash: (Bajarilgan / Plan) * 100
            let percentVal = 0;
            if (item.volume_plan > 0) {
                percentVal = Math.round((item.volume_value / item.volume_plan) * 100);
            }

            // Statusni aniqlash
            let status = "waiting";
            if (percentVal >= 100) status = "done";
            else if (percentVal > 0) status = "process";

            return {
                name: postName.toUpperCase(),
                value: `${item.volume_value} / ${item.volume_plan} ${item.unit}`,
                percent: `${percentVal}%`,
                count: `${item.qty_value} / ${item.qty_plan} dona`,
                status: status
            };
        });

        return {
            id: order.order_id,
            order_name: order.order_title,
            date: order.deadline,
            factory: apiResponse.factory_name,
            // Balans hozircha API'da yo'q, shuning uchun vaqtincha default qiymat
            balance: { total: "Noma'lum", paid: "0", debt: "0" },
            steps: steps,
            files: [] // Kelajakda fayllar qo'shilsa shu yerga tushadi
        };
    });
}

// 2. Ma'lumotlarni yuklash (Fetch)
async function loadData() {
    const container = document.getElementById('order-list');

    try {
        // Real API ishga tushganda quyidagi qism ishlaydi:
        /*
        const response = await fetch('https://staging.mespro.uz/api/v1/bot/get-contractor-data/', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-API-KEY': 'baad3b85-fa44-4e1f-8efb-832793368d6d'
            },
            body: JSON.stringify({ tg_id: 6101533294 }) // Bu yerda tg_id ishlatiladi
        });
        const apiData = await response.json();
        */

        // HOZIRCHA: Siz yuborgan namunaviy JSON bilan ishlash (Test uchun)
        const mockApiResponse = {
            "status": "success",
            "factory_name": "Smart Factory LLC",
            "order_matrix": [
                {
                    "order_id": 16,
                    "order_title": "№42 / 1 ",
                    "deadline": "07.04.2026",
                    "post_data": {
                        "Arra": { "volume_plan": 1.26, "volume_value": 0.5, "qty_plan": 1, "qty_value": 0, "unit": "m2" },
                        "Kromka": { "volume_plan": 2.13, "volume_value": 2.13, "qty_plan": 1, "qty_value": 1, "unit": "m2" },
                        "Upakovka": { "volume_plan": 1.0, "volume_value": 0.0, "qty_plan": 1, "qty_value": 0, "unit": "m2" }
                    }
                }
            ]
        };

        const orders = transformData(mockApiResponse);

        if (orders.length === 0) {
            container.innerHTML = "<p style='text-align:center;'>Buyurtmalar topilmadi.</p>";
        } else if (orders.length === 1) {
            renderOrderDetail(orders[0]);
        } else {
            renderOrderList(orders);
        }

    } catch (error) {
        console.error("Xatolik:", error);
        container.innerHTML = "<p style='color:red;'>Ma'lumot yuklashda xatolik yuz berdi.</p>";
    }
}

// 3. Ro'yxatni chiqarish
function renderOrderList(orders) {
    const container = document.getElementById('order-list');
    container.innerHTML = `
        <h2 style="text-align:center; color:#3b82f6; margin-bottom: 20px;">Mening Buyurtmalarim</h2>
        <div class="order-buttons-grid">
            ${orders.map((order, index) => `
                <button class="order-select-btn" onclick='renderOrderDetail(${JSON.stringify(order)})'>
                    ${order.order_name} (${order.factory})
                </button>
            `).join('')}
        </div>
    `;
}

// 4. Detallarni chiqarish
let animationInterval;
function renderOrderDetail(order) {
    const container = document.getElementById('order-list');
    clearInterval(animationInterval);

    const stepsHtml = order.steps.map((step, i) => `
        <div class="status-item ${step.status}">
            <span class="step-name">${step.name}</span>
            <div class="step-info-container">
                <span class="step-value active" id="val-${i}">${step.value}</span>
                <span class="step-value" id="per-${i}">${step.percent}</span>
                <span class="step-value" id="cnt-${i}">${step.count}</span>
            </div>
        </div>
    `).join('');

    container.innerHTML = `
        <div class="balance-card animate-in">
            <div class="bal-item"><span>Zavod:</span> <b>${order.factory}</b></div>
            <div class="bal-item"><span>Muddati:</span> <b>${order.date}</b></div>
        </div>
        <div class="card animate-in">
            <div class="card-header"><h3>${order.order_name}</h3></div>
            <div class="status-grid">${stepsHtml}</div>
        </div>
        <button onclick="loadData()" style="width:100%; margin-top:20px; background:none; border:1px solid #334155; color:#94a3b8; padding:10px; border-radius:10px;">⬅ Orqaga qaytish</button>
    `;

    startAnimation(order.steps.length);
}

function startAnimation(count) {
    let currentDisplay = 0;
    animationInterval = setInterval(() => {
        for (let i = 0; i < count; i++) {
            const v = document.getElementById(`val-${i}`);
            const p = document.getElementById(`per-${i}`);
            const c = document.getElementById(`cnt-${i}`);
            if(v && p && c) {
                v.classList.remove('active'); p.classList.remove('active'); c.classList.remove('active');
                if (currentDisplay === 0) v.classList.add('active');
                else if (currentDisplay === 1) p.classList.add('active');
                else c.classList.add('active');
            }
        }
        currentDisplay = (currentDisplay + 1) % 3;
    }, 3000);
}

window.onload = loadData;