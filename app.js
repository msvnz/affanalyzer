function parseFile(file) {
    return new Promise((resolve) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                resolve(results.data);
            }
        });
    });
}

async function proses() {

    const meta = document.getElementById("meta").files[0];
    const click = document.getElementById("click").files[0];
    const comm = document.getElementById("comm").files[0];

    if (!meta || !click || !comm) {
        alert("Upload 3 CSV terlebih dahulu");
        return;
    }

    const metaRows = await parseFile(meta);
    const clickRows = await parseFile(click);
    const commRows = await parseFile(comm);

    let klikMeta = 0;
    let spendMeta = 0;
    let komisiShopee = 0;

    // META ADS
    metaRows.forEach(row => {

        const hasil =
            parseFloat(
                String(row["Hasil"] || "0")
                .replace(/,/g, "")
            ) || 0;

        const spend =
            parseFloat(
                String(row["Jumlah yang dibelanjakan (IDR)"] || "0")
                .replace(/,/g, "")
            ) || 0;

        klikMeta += hasil;
        spendMeta += spend;

    });

    // SHOPEE CLICK
    const klikShopee = clickRows.length;

    // ORDERAN
    const orderanShopee = commRows.length;

    // KOMISI
    commRows.forEach(row => {

        const komisi =
            parseFloat(
                String(row["Komisi Bersih Affiliate (Rp)"] || "0")
                .replace(/,/g, "")
            ) || 0;

        komisiShopee += komisi;

    });

    const tgl = new Date().toLocaleDateString("id-ID");

    document.getElementById("hasil").innerHTML = `
        <table>
            <tr>
                <th>Tanggal</th>
                <th>Klik Meta</th>
                <th>Klik Shopee</th>
                <th>Orderan Shopee</th>
                <th>Spend Meta</th>
                <th>Komisi Shopee</th>
            </tr>

            <tr>
                <td>${tgl}</td>
                <td>${klikMeta.toLocaleString("id-ID")}</td>
                <td>${klikShopee.toLocaleString("id-ID")}</td>
                <td>${orderanShopee.toLocaleString("id-ID")}</td>
                <td>Rp ${spendMeta.toLocaleString("id-ID")}</td>
                <td>Rp ${komisiShopee.toLocaleString("id-ID")}</td>
            </tr>

            <tr style="font-weight:bold;background:#f5f5f5;">
                <td>TOTAL</td>
                <td>${klikMeta.toLocaleString("id-ID")}</td>
                <td>${klikShopee.toLocaleString("id-ID")}</td>
                <td>${orderanShopee.toLocaleString("id-ID")}</td>
                <td>Rp ${spendMeta.toLocaleString("id-ID")}</td>
                <td>Rp ${komisiShopee.toLocaleString("id-ID")}</td>
            </tr>
        </table>
    `;
}
