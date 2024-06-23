from fastapi import FastAPI, HTTPException, Request,Query
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from pydantic import BaseModel
from typing import List
import pymysql

conn = pymysql.connect(host="127.0.0.1", user="root", password="tt11452954*", 
                        db='sung', charset="utf8", cursorclass=pymysql.cursors.DictCursor)
cur = conn.cursor()
from fastapi.staticfiles import StaticFiles
import pandas as pd
#import logic as lo

templates = Jinja2Templates(directory="/Users/changwook-bae/Desktop/2024-1/informationsystem/API_V1/project_haein2/templates")


app = FastAPI()

app.mount("/static", StaticFiles(directory="/Users/changwook-bae/Desktop/2024-1/informationsystem/API_V1/project_haein2/static"), name="static")
app.mount("/img", StaticFiles(directory="project_haein2/img"), name="img")
fake_items_db = [{"item_name": "Foo"}, {"item_name": "Bar"}, {"item_name": "Baz"}]

#여기가 키오스크 시작화면 매장or 주문
@app.get("/")
async def home(request: Request):
    return templates.TemplateResponse("index.html",{"request":request})
'''
if __name__=="__main__":
    import uvicorn
    uvicorn.run(app, host="123.212.69.146", port=12345)
'''   

@app.get("/kiosk_menu", response_class=HTMLResponse)
async def get_kiosk_menu(request: Request, value: int = Query(None)):
    try:
        with conn.cursor() as cursor:
            sql = "SELECT b_name, b_price, b_inventory, b_description FROM sung.bread"
            cursor.execute(sql)
            menu_items = cursor.fetchall()
            return templates.TemplateResponse("kiosk_menu.html", {"request": request, "menu_items": menu_items, "value": value})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class CartItem(BaseModel):
    name: str
    quantity: int
    value: int

class Cart(BaseModel):
    items: List[CartItem]

cart_data=[]
@app.post("/submit-cart")
async def submit_cart(cart: Cart):
    print("Received cart items:")
    for item in cart.items:
        print(f"Item name: {item.name}, Quantity: {item.quantity}, Value: {item.value}")
    global cart_data
    cart_data = cart.dict()
    return RedirectResponse(url="/kiosk_membership", status_code=303)

@app.get("/kiosk_membership", response_class=HTMLResponse)
async def get_kiosk_payment_page(request: Request):
    return templates.TemplateResponse("kiosk_membership.html", {"request": request, "cart_items": cart_data})

@app.get("/kiosk_payment", response_class=HTMLResponse)
async def get_kiosk_payment(request: Request):
    return templates.TemplateResponse("kiosk_payment.html", {"request": request, "cart_items": cart_data})

@app.get("/api/checkMembership")
async def check_membership(phone: str):
    try:
        with conn.cursor() as cursor:
            sql = "SELECT c_name, c_currentpoint, customer_level_l_id FROM customer WHERE c_tel = %s"
            cursor.execute(sql, (phone,))
            result = cursor.fetchone()
            if not result:
                return {"success": False, "message": "Customer not found"}
            return {"success": True, "customer": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))













@app.get("/search/")
async def home(request: Request):
    return templates.TemplateResponse("search.html",{"request":request})

@app.get("/search_get/")
async def home(request: Request):
    return templates.TemplateResponse("search_get.html",{"request":request})

@app.get("/insert/")
async def home(request: Request):
    return templates.TemplateResponse("insert.html",{"request":request})

@app.get("/items/")
async def read_item(skip: int = 0, limit: int = 10):
    return fake_items_db[skip : skip + limit]
'''
import pymysql

conn = pymysql.connect(host="127.0.0.1", user="root", password="tt11452954*", 
                        db='test123', charset="utf8", cursorclass=pymysql.cursors.DictCursor)
cur = conn.cursor()
'''
@app.get("/userInfo/")
def getUserInfoByName():
  sql = "SELECT * FROM 회원"
  cur.execute(sql)
  row = cur.fetchall()

  df = pd.DataFrame(row)
  total_usage_score = df['이용점수'].sum()

  purple_usage_score_sum = df[df['등급'] == 'purple']['이용점수'].sum()

  print(total_usage_score)
  print(purple_usage_score_sum)

  print(row)
  return {
    'total_usage_score': str(total_usage_score),
    'purple_usage_score_sum': str(purple_usage_score_sum)
  } #문자열 형태로 return

@app.get("/userInfo_get/")
def getUserInfoByNumberAndName(memberId: str = Query(..., description="회원번호를 입력하세요"), memberName: str = Query(..., description="회원이름을 입력하세요")):
    try:
        print(f"Received 회원번호: {memberId}, 회원이름: {memberName}")  # 디버깅용 출력 백로그를  print로 찍어낸다.
        sql = "SELECT * FROM 회원 WHERE 회원번호 = 123 AND 회원이름 = '박산공'"
        cur.execute("SELECT * FROM 회원 WHERE 회원번호 = %s AND 회원이름 = %s",(memberId,memberName))

        row = cur.fetchall()

        print(row)
        
        if not row:
            raise HTTPException(status_code=404, detail="User not found")
        
        return row
    
    except Exception as e:
        print(f"Error: {e}")  # 디버깅용 출력
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/insert_info/")
def insert_info(user_id:str, oder_id:str, item_id:str, item_q:str, item_p:str):
    sql = "INSERT INTO 주문 (주문고객번호, 주문상품번호, 주문번호, 주문수량, 상품가격) VALUES (%s, %s, %s, %s, %s)"
    cur.execute(sql, (user_id, item_id, oder_id, item_q, item_p))
    conn.commit()
# http://127.0.0.1:7000/insert_info/?user_id=123&oder_id=f123&item_id=a5&item_q=10&item_p=10000

@app.get("/logic_test")
def get_customer_benefits(purchase_total:int):
    membership_level = lo.get_membership_level(purchase_total)
    discount_rate = lo.get_discount_rate(membership_level)
    free_shipping = lo.has_free_shipping(membership_level)

    return {
        'purchase_total': purchase_total,
        'membership_level': membership_level,
        'discount_rate': discount_rate,
        'free_shipping': free_shipping
    }


if __name__=="__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)