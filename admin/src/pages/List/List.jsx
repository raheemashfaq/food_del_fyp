import React,{useState,useEffect} from 'react'
import './List.css'
import axios from 'axios';
import {toast} from "react-toastify"
import Skeleton from '../../components/Skeleton/Skeleton'

const List = () => {
  // {url}
  const url = import.meta.env.VITE_API_URL
  const [list,setList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const  fetchList = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${url}/api/food/list`)
      console.log(response.data)
      if(response.data.success){
        setList(response.data.data);
      }
      else{
        toast.error("Error")
      }
    } catch (error) {
      toast.error("Error fetching foods")
    } finally {
      setIsLoading(false);
    }
  }

  const removeFood = async(foodId)=>{
    // console.log(foodId);
    const response = await axios.post(`${url}/api/food/remove`,{id:foodId})
    await fetchList();
    if(response.data.success){
      toast.success(response.data.message)
    }
    else{
      toast.error("Error")
    }
  }

  useEffect(()=>{
    fetchList();
  },[])

  return (
    <div className="list add flex-col">
      <p>All Foods List</p>
      <div className="list-table">
        <div className="list-table-format title">
            <p>Image</p>
            <p>Name</p>
            <p>Category</p>
            <p>Price</p>
            <p>Action</p>
        </div>
        {isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="list-table-format">
                <Skeleton width="50px" height="50px" radius="6px" />
                <Skeleton width="70%" height="14px" />
                <Skeleton width="60%" height="14px" />
                <Skeleton width="50%" height="14px" />
                <Skeleton width="16px" height="16px" />
              </div>
            ))
          : list.map((item,index)=>{
            return (
              <div key={index} className="list-table-format">
                  <img src={`${url}/images/`+item.image}/>
                  <p>{item.name}</p>
                  <p>{item.category}</p>
                  <p>Rs.{item.price}</p>
                  <p onClick={()=>removeFood(item._id)} className="cursor">x</p>
              </div>
            )
        })}
      </div>
    
    </div>
  )
}

export default List