using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using AutoMapper;
using DatingApp.API.Data;
using DatingApp.API.Dtos;
using DatingApp.API.Helpers;
using DatingApp.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DatingApp.API.Controllers
{
    [ServiceFilter(typeof(LogUserActivity))]
    [Authorize]
    [Route("api/users/{userId}/[controller]")]
    [ApiController]
    public class MessagesController : ControllerBase
    {
        private readonly IDatingRepository _repo;
        private readonly IMapper _mapper;
        public MessagesController(IDatingRepository repo, IMapper mapper)
        {
            _mapper = mapper;
            _repo = repo;

        }


        // General Information:
        // int userId parameter in the methods, is obtained from the route string thanks to model binding


        [HttpGet]
        public async Task<IActionResult> GetMessagesForUser(int userId, 
            [FromQuery] MessageParams messageParams){
            //check if the user is trying to update their own profile
            if(userId != int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value))
                return Unauthorized();

            messageParams.UserId = userId;

            var messagesFromRepo = await _repo.GetMessagesForUser(messageParams);

            var messagesToReturn = _mapper.Map<IEnumerable<MessageToReturnDto>>(messagesFromRepo);

            // this next, the pagination, is contained in the header
            Response.AddPagination(messagesFromRepo.CurrentPage, messagesFromRepo.PageSize, 
                messagesFromRepo.TotalCount, messagesFromRepo.TotalPages);
            
            return Ok(messagesToReturn);
        }

        [HttpGet("thread/{recipientId}")]
        public async Task<IActionResult> GetMessageThread(int userId, int recipientId)
        {
            //check if the user is trying to update their own profile
            if(userId != int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value))
                return Unauthorized();

            var messagesFromRepo = await _repo.GetMessageThread(userId,recipientId);
            var messageThread = _mapper.Map<IEnumerable<MessageToReturnDto>>(messagesFromRepo);

            return Ok(messageThread);
        }

        [HttpGet("{id}", Name="GetMessage")]
        public async Task<IActionResult> GetMessage(int userId, int id){
            //check if the user is trying to update their own profile
            if(userId != int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value))
                return Unauthorized();

            var messageFromRepo = await _repo.GetMessage(id);

            if(messageFromRepo == null){
                return NotFound();
            }

            return Ok(messageFromRepo);
            
        }

        // This method doesn't need any parameter (i.e id of the message)
        // because the id will be generated with the new message
        // and it will use the route of the controller:
        [HttpPost]
        public async Task<IActionResult> SendMessage(int userId, MessageForCreationDto messageForCreationDto){
            
            // this is done so automapper can collect the data and map it into the DTO:
            var sender = await _repo.GetUser(userId); 
            
            //check if the user is trying to update their own profile
            if(sender.Id != int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value))
                return Unauthorized();
            
            // Let's fill the Dto:
            messageForCreationDto.SenderId = userId;

            var recipient = _repo.GetUser(messageForCreationDto.RecipientId);

            if (recipient == null)
            {
                return NotFound("User could not be found");
            }

            // map the dto in the message:
            var message = _mapper.Map<Message>(messageForCreationDto);

            _repo.Add<Message>(message);


            if(await _repo.SaveAll()){
                var messageToReturn = _mapper.Map<MessageToReturnDto>(message);
                return CreatedAtRoute("GetMessage",new { id = message.Id}, messageToReturn );
            }

            throw new Exception("Creating the message failed on save");
        }

        [HttpPost("{id}")]
        public async Task<IActionResult> DeleteMessage (int id, int userId) {
            //check if the user is trying to update their own profile
            if(userId != int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value))
                return Unauthorized();

            var messageFromRepo = await _repo.GetMessage(id);

            if(messageFromRepo == null) {
                return NotFound("Message not found");
            }

            if (messageFromRepo.RecipientId == userId) {
                messageFromRepo.RecipientDeleted = true;
            }

            if (messageFromRepo.SenderId == userId) {
                messageFromRepo.SenderDeleted = true;
            }

            if (messageFromRepo.SenderDeleted && messageFromRepo.RecipientDeleted) {
                _repo.Delete(messageFromRepo);
            }

            if (await _repo.SaveAll())
                return NoContent();
            
            throw new Exception("Error deleting message");
        }

        [HttpPost("{id}/read")]
        public async Task<IActionResult> MarkMessageAsRead (int userId, int id) {
            //check if the user is trying to update their own profile
            if(userId != int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value))
                return Unauthorized();

            var message = await _repo.GetMessage(id);
            
            if (message.RecipientId != userId)
                return Unauthorized();

            message.IsRead=true;
            message.DateRead = DateTime.Now;

            await _repo.SaveAll();

            return NoContent();
        }
    }
}