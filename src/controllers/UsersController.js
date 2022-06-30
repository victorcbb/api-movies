const knex = require('../database/knex')
const AppError = require('../utils/AppError')
const { hash, compare } = require('bcryptjs')

class UsersController {
  async create(req, res) {
    const { name, email, password } = req.body

    const checkUserExist = await knex("users").where({ email }).first()

    if(checkUserExist) {
      throw new AppError("Este e-mail já está em uso.")
    }

    const hashedPassword = await hash(password, 8)

    await knex("users").insert({
      name,
      email,
      password: hashedPassword
    })

    return res.status(201).json()
  }

  async update(req, res) {
    const { name, email, password, old_password } = req.body
    const { id } = req.params

    const user = await knex("users").where({ id })

    if(!user) {
      throw new AppError("Usuário não encontrado")
    }

    const userWithUpdatedEmail = await knex("users").where({ email })

    if (userWithUpdatedEmail && userWithUpdatedEmail[0].id !== user[0].id) {
      throw new AppError("Este e-mail já está em uso")
    }

    console.log(user[0].password);
    console.log(old_password);

    user[0].name = name ?? user[0].name
    user[0].email = email ?? user[0].email

    if(password && !old_password) {
      throw new AppError("Insira a senha antiga")
    }

    if(password && old_password) {
      const chechOldPassword = await compare(old_password, user[0].password)

      if (!chechOldPassword) {
        throw new AppError("Senha antiga não confere")
      }

      user[0].password = await hash(password, 8)
    }

    await knex("users").update({
      name,
      email,
      password: user[0].password,
      updated_at: knex.fn.now()
    }).where("id", user[0].id)

    return res.json()
  }
}

module.exports = UsersController
