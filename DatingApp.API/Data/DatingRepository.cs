using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DatingApp.API.Helpers;
using DatingApp.API.Models;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.API.Data
{
    public class DatingRepository : IDatingRepository
    {
        private readonly DataContext _context;
        public DatingRepository(DataContext context)
        {
            _context = context;

        }
        public void Add<T>(T entity) where T : class
        {
            _context.Add(entity);
        }

        public void Delete<T>(T entity) where T : class
        {
            _context.Remove(entity);
        }

        public async Task<Photo> GetPhoto(int id)
        {
            var photo = await _context.Photos.FirstOrDefaultAsync(p => p.Id == id);

            return photo;
        }

        public async Task<Photo> GetMainPhotoForUser(int userId)
        {
            var photo = await _context.Photos.FirstOrDefaultAsync(p => p.UserId == userId && p.IsMain == true);

            return photo;
        }

        public async Task<User> GetUser(int id)
        {
            var user = await _context.Users.Include(p=>p.Photos).FirstOrDefaultAsync(u=>u.Id==id);
            return user;
        }
        
        //userParams is a class to store pagination, filtering and sorting
        public async Task<PagedList<User>> GetUsers(UserParams userParams)
        {
            //asQueryable so we can apply Where (Linq)
            var users = _context.Users.Include(p=>p.Photos).OrderByDescending(u => u.LastActive).AsQueryable();

            // don't show themselves on the list of users:
            users = users.Where(u => u.Id != userParams.UserId);

            // by default show the opposite gender 
            //unless something else is specified on userParams:
            users = users.Where(u => u.Gender == userParams.Gender);

            //check if in the params in http request, the user is requesting the likees / likers
            if(userParams.Likers)
            {
                // populate the array of integers with the id of the likers:
                var userLikers = await GetUserLikes(userParams.UserId, userParams.Likers);
                // filter the user table to retrieve only the ones that match with the previous list:
                users = users.Where(u => userLikers.Contains(u.Id));
            }
            if(userParams.Likees)
            {
               // populate the array of integers with the id of the likers:
                var userLikees = await GetUserLikes(userParams.UserId, userParams.Likers);
                // filter the user table to retrieve only the ones that match with the previous list:
                users = users.Where(u => userLikees.Contains(u.Id));
            }

            // if sprecified on userParams, we filter by age:
            if(userParams.MinAge != 18 || userParams.MaxAge !=99){
                 // the minimum date of birth depends on the maximum age preferred:
                 var minDob = DateTime.Today.AddYears(-userParams.MaxAge - 1);

                 // the maximum date of birth depends on the minimum age preferred:
                 var maxDob = DateTime.Today.AddYears(-userParams.MinAge);

                 users= users.Where(u => u.DateOfBirth >= minDob && u.DateOfBirth <= maxDob);
            }

            // Check if there's a sorting preference:
            if(!string.IsNullOrEmpty(userParams.OrderBy)){
                switch (userParams.OrderBy){
                    case "created":
                        users=users.OrderByDescending(u=>u.Created);
                        break;
                    default:
                        users = users.OrderByDescending(u => u.LastActive);
                        break;
                }
            }


            return await PagedList<User>.CreateAsync(users,userParams.PageNumber,userParams.PageSize);
        }
        
        // depending on the "likers" parameter, we'll return a list of integers
        // representing the id's of likers OR likees
        private async Task<IEnumerable<int>> GetUserLikes(int id, bool likers){
            // retrieve user along with likers and likees 
            var user = await _context.Users
                .Include(x => x.Likers)
                .Include(x=> x.Likees)
                .FirstOrDefaultAsync(u=>u.Id==id);

            // if we want to get the likers (users who have liked the user that's logged in):
            if(likers){
                // "select" just the id property to return a list of integers
                return user.Likers.Where(u=> u.LikeeId == id).Select(i => i.LikerId);
            }
            // if we want to get the likees (users who have been liked by the user that's logged in):
            else{
                return user.Likees.Where(u => u.LikerId == id).Select(i=> i.LikeeId);
            }
        }
        public async Task<bool> SaveAll()
        {
            return await _context.SaveChangesAsync() > 0;
        }

        // method to check if the user (id) has already liked the user(recipientId)
        public async Task<Like> GetLike(int id, int recipientId)
        {
            return await _context.Likes.FirstOrDefaultAsync(u => 
                u.LikerId == id && u.LikeeId == recipientId);
        }

        public async Task<Message> GetMessage(int id)
        {
            return await _context.Messages.FirstOrDefaultAsync(u =>
                u.Id == id);
        }

        public async Task<PagedList<Message>> GetMessagesForUser(MessageParams messageParams)
        {
            var messages = _context.Messages
                .Include(u => u.Sender).ThenInclude(p => p.Photos)
                .Include(u => u.Recipient).ThenInclude(p => p.Photos)
                .AsQueryable();
            
            // filtering
            switch (messageParams.MessageContainer)
            {
                case "Inbox":
                    messages = messages.Where(i => i.RecipientId == messageParams.UserId && i.RecipientDeleted == false);
                    break;
                case "Outbox":
                    messages = messages.Where(i => i.SenderId == messageParams.UserId && i.SenderDeleted == false);
                    break;
                default:
                    messages = messages.Where(i => i.RecipientId == messageParams.UserId && i.IsRead == false && i.RecipientDeleted == false);
                    break;
            }

            // ordering:
            messages = messages.OrderByDescending(i => i.MessageSent);

            // return the paginated list:
            return await PagedList<Message>.CreateAsync(messages, messageParams.PageNumber, messageParams.PageSize);
        }

        public async Task<IEnumerable<Message>> GetMessageThread(int userId, int recipientId)
        {
            // retrieve full conversation between two users:
            var messages = await _context.Messages
                .Include(u => u.Sender).ThenInclude(p => p.Photos)
                .Include(u => u.Recipient).ThenInclude(p => p.Photos)
                // next line allows to bring both inbox and outbox
                .Where(m => m.SenderId == userId && m.RecipientId == recipientId && m.SenderDeleted == false
                    || m.SenderId == recipientId && m.RecipientId == userId && m.RecipientDeleted == false)
                .OrderByDescending(m => m.MessageSent)
                .ToListAsync();

            
            return messages;
        }
    }
}