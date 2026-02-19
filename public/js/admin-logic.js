// Admin Logic
function showAdminTab(id) {
    // Logic for switching tabs in admin dashboard
    console.log('Switching to admin tab:', id);
}

function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}

// Sample admin product rendering
document.addEventListener('DOMContentLoaded', () => {
    const list = document.getElementById('adminProductsList');
    if (list) {
        list.innerHTML = `
            <tr>
                <td><img src="https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&q=80&w=50" alt="Product"></td>
                <td>Glow Serum</td>
                <td>Skincare</td>
                <td>$45.00</td>
                <td>20</td>
                <td>
                    <button class="btn btn-sm">Edit</button>
                    <button class="btn btn-sm btn-outline">Hide</button>
                </td>
            </tr>
        `;
    }
});
