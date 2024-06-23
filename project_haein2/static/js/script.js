let cart = [];

function showPopup1(name, price, stock, description, imgSrc) {

  document.getElementById('popup-name').innerText = name;
  document.getElementById('popup-stock').innerText = '재고: ' + stock;
  document.getElementById('popup-description').innerText = description;
  document.getElementById('popup-price').innerText = '₩' + price;
  document.getElementById('popup-img').src = imgSrc;
  document.getElementById('quantity').innerText = 1;
  document.getElementById('popup-item').classList.add('active');
}

function showPopup2() {
  document.getElementById('popup-sign').classList.add('active');
}

function hidePopup() {
    document.querySelectorAll('.popup').forEach(popup => {
        popup.classList.remove('active');
    });
}

function updateQuantity(change) {
    const quantityElem = document.getElementById('quantity');
    let quantity = parseInt(quantityElem.innerText);
    quantity = Math.max(1, quantity + change); // 최소 수량은 1
    quantityElem.innerText = quantity;
}

function addToCart() {
    const name = document.getElementById('popup-name').innerText;
    const price = parseInt(document.getElementById('popup-price').innerText.replace('₩', ''));
    const quantity = parseInt(document.getElementById('quantity').innerText);

    if (items[name].stock < quantity) {
        alert('재고가 부족합니다.');
        return;
    }

    items[name].stock -= quantity;
    updateItemStockDisplay(name);

    const existingItem = cart.find(item => item.name === name);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ name: name, quantity: quantity, price: price });
    }
    alert('장바구니에 담겼습니다!');
    hidePopup();
    updateCartDisplay();
}

function updateItemStockDisplay(name) {
  const itemElems = document.querySelectorAll('.item');
  itemElems.forEach(itemElem => {
      if (itemElem.querySelector('.name').innerText === name) {
          itemElem.querySelector('.stock').innerText = '재고: ' + items[name].stock;
      }
  });
}

function updateCartDisplay() {
    const cartItemsElem = document.getElementById('cart-items');
    const totalPriceElem = document.querySelector('.total-price');
    cartItemsElem.innerHTML = '';

    let total = 0;

    cart.forEach(item => {
        const li = document.createElement('li');
        li.className = 'cart-item';
        li.setAttribute('data-name', item.name);
        li.setAttribute('data-quantity', item.quantity);
        li.setAttribute('data-value',item.value)
        li.setAttribute('data-price', item.price);
        li.innerText = `${item.name} - 수량: ${item.quantity} - 가격: ${item.price * item.quantity}원`;
        cartItemsElem.appendChild(li);

        total += item.price * item.quantity;
    });
    total_price=total
    totalPriceElem.innerText = `총 금액 : ${total}원`;
}

function gobackpage() {
  // 전페이지로 돌아가는 로직 추가
  alert('기본페이지로 돌아갑니다');
}

function gotosign() {
  const totalPrice = parseInt(document.querySelector('.total-price').innerText.replace('총 금액 : ', '').replace('원', ''));
  if (totalPrice === 0) {
    alert('총 결제 금액이 0원입니다. 결제할 수 없습니다.');
    return;
  }
  document.getElementById('popup-sign').classList.add('active');
}

function gotopayment() {
  // 결제창으로 이동
  alert('결제창으로 이동합니다.');
  location.href = '/kiosk_payment';
  return location.href
}

function confirmsign() {
  // 장바구니 아이템 수집
  const cartItems = document.querySelectorAll('.cart-item');
  const items = [];

  cartItems.forEach(item => {
    const name = item.getAttribute('data-name');
    const quantity = item.getAttribute('data-quantity');
    //const total = item.getAttribute('data-total');
    //const value = parseInt(item.getAttribute('data-value'));
    items.push({ name, quantity, value});
  });

  // 서버로 데이터 전송
  fetch('/submit-cart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ items })
  })
  .then(response => {
    if (response.redirected) {
      window.location.href = '/kiosk_membership';
    } else {
      return response.json();
    }
  })
  .then(data => {
    if (data) {
      console.log('Success:', data);
      // 결제 완료 페이지로 이동 또는 다른 처리
    }
  })
  .catch((error) => {
    console.error('Error:', error);
  });

  // 회원번호입력 창으로 넘어가기
  alert('회원번호 입력창으로 이동합니다.');
}

// 멤버십 팝업을 보여주는 함수
function showMembershipPopup() {
  document.getElementById('membership-popup').classList.add('active');
}

function submitPhoneNumber() {
  const phoneNumber = document.getElementById('numInput').value;
  checkMembership(phoneNumber);
}

function checkMembership(phoneNumber) {
  fetch(`/api/checkMembership?phone=${phoneNumber}`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const { c_name, customer_level_l_id, c_currentpoint } = data.customer;
        document.getElementById('customer-level').innerText = `등급 : ${customer_level_l_id}`;
        document.getElementById('current-point').innerText = `사용포인트 : ${c_currentpoint}`;

        const originalPrice = getTotalCartPrice(); // 총 금액을 가져오는 함수
        const discountRate = getDiscountRate(customer_level_l_id);
        const discountAmount = originalPrice * discountRate;
        const finalPrice = calculateFinalPrice(originalPrice, discountRate, 0); // 포인트 사용은 여기서 0으로 가정

        document.getElementById('discount-amount').innerText = `할인금액 : ${discountAmount}원`;
        document.querySelector('.total-price').innerText = `최종 금액 : ${finalPrice}원`;

        hidePopup();
      } else {
        alert('회원 정보를 찾을 수 없습니다.');
      }
    })
    .catch(error => {
      console.error('Error:', error);
     // alert('오류가ㅁㅁㅁㅁㅁ.');
    });
  }

// 키패드를 초기화하는 함수
document.addEventListener('DOMContentLoaded', function() {
  const numInput = document.getElementById('numInput');
  const keypad = document.getElementById('keypad');

  const buttons = [
      '1', '2', '3',
      '4', '5', '6',
      '7', '8', '9',
      '<-', '0', '확인'
  ];

  buttons.forEach(function(button) {
      const btn = document.createElement('button');
      btn.textContent = button;
      if (button === '<-') {
          btn.classList.add('delete');
      } else if (button === '확인') {
          btn.classList.add('submit');

      }
      btn.addEventListener('click', function() {
          if (button === '<-') {
              numInput.value = numInput.value.slice(0, -1);
          } else if (button === '확인') {
              submitPhoneNumber();
              hidePopup();
          } else {
              numInput.value += button;
          }
      });
      keypad.appendChild(btn);
  });
})

function getTotalCartPrice() {
  // 장바구니 총 금액을 계산하는 함수
  let total = 0;
  cart.forEach(item => {
    total += item.price * item.quantity;
  });
  return total;
}