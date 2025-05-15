import { User } from '@/types/api/auth';
import { request } from '../axios';


export class UserAxiosClient {
  private readonly endpoint = '/api/user';

  fetchUser() {
    return request<undefined, User>({
      url: this.endpoint,
      method: 'get',
    });
  }

  updateUser(data: Partial<User>) {
    return request<Partial<User>, User>({
      url: this.endpoint,
      method: 'patch',
    }, data);
  }

}
